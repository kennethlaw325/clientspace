"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReviewNotification } from "@/lib/email";
import type { Database } from "@/types/database";

type ReviewRow = Database["public"]["Tables"]["deliverable_reviews"]["Row"];
type ReviewCommentRow = Database["public"]["Tables"]["review_comments"]["Row"];
type ReviewTokenRow = Database["public"]["Tables"]["review_tokens"]["Row"];

export type ReviewWithToken = ReviewRow & {
  review_tokens: ReviewTokenRow[];
  review_comments: ReviewCommentRow[];
};

// ─────────────────────────────────────────────
// 查詢
// ─────────────────────────────────────────────

export async function getProjectReviews(projectId: string): Promise<ReviewWithToken[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverable_reviews")
    .select("*, review_tokens(*), review_comments(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (data ?? []) as ReviewWithToken[];
}

export async function getReviewByToken(token: string) {
  const supabase = createAdminClient();

  // 驗證 token 有效性
  const { data: tokenRow } = await supabase
    .from("review_tokens")
    .select("*, deliverable_reviews(*)")
    .eq("token", token)
    .single() as { data: (ReviewTokenRow & { deliverable_reviews: ReviewRow }) | null };

  if (!tokenRow) return null;

  // 檢查是否過期
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return null;
  }

  const review = tokenRow.deliverable_reviews;
  if (!review) return null;

  // 取得評論
  const { data: comments } = await supabase
    .from("review_comments")
    .select("*")
    .eq("review_id", review.id)
    .order("created_at", { ascending: true });

  return {
    review,
    comments: (comments ?? []) as ReviewCommentRow[],
    token: tokenRow.token,
  };
}

// ─────────────────────────────────────────────
// 建立審核項目
// ─────────────────────────────────────────────

export async function createReview(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const file_url = formData.get("file_url") as string;
  const file_type = formData.get("file_type") as string;

  if (!title?.trim()) return { error: "標題為必填" };

  const { data: review, error } = await supabase
    .from("deliverable_reviews")
    .insert({
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || null,
      file_url: file_url?.trim() || null,
      file_type: file_type || null,
      created_by: user.id,
    } as Database["public"]["Tables"]["deliverable_reviews"]["Insert"])
    .select()
    .single() as { data: ReviewRow | null; error: Error | null };

  if (error) return { error: (error as Error).message };
  if (!review) return { error: "建立失敗" };

  // 自動生成 review token
  const tokenResult = await generateReviewToken(review.id);
  if (tokenResult.error) return { error: tokenResult.error };

  return { data: review, token: tokenResult.token };
}

// ─────────────────────────────────────────────
// 上傳檔案並建立審核項目
// ─────────────────────────────────────────────

export async function createReviewWithFile(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const file = formData.get("file") as File | null;
  const link_url = formData.get("link_url") as string;

  if (!title?.trim()) return { error: "標題為必填" };
  if (!file && !link_url?.trim()) return { error: "請上傳檔案或輸入連結" };

  let file_url: string | null = null;
  let file_type: string | null = null;

  if (file && file.size > 0) {
    if (file.size > 52428800) return { error: "檔案不能超過 50MB" };

    // 取得 workspace id 用於 storage path
    const { data: project } = await supabase
      .from("projects")
      .select("workspace_id")
      .eq("id", projectId)
      .single() as { data: { workspace_id: string } | null };

    if (!project) return { error: "找不到專案" };

    const storagePath = `${project.workspace_id}/${projectId}/reviews/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file);

    if (uploadError) return { error: uploadError.message };

    const { data: signedData } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    file_url = storagePath; // 儲存 path，需要時再取 signed URL
    file_type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "other";
    void signedData;
  } else if (link_url?.trim()) {
    file_url = link_url.trim();
    file_type = "link";
  }

  const { data: review, error } = await supabase
    .from("deliverable_reviews")
    .insert({
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || null,
      file_url,
      file_type,
      created_by: user.id,
    } as Database["public"]["Tables"]["deliverable_reviews"]["Insert"])
    .select()
    .single() as { data: ReviewRow | null; error: Error | null };

  if (error) return { error: (error as Error).message };
  if (!review) return { error: "建立失敗" };

  // 自動生成 review token
  const tokenResult = await generateReviewToken(review.id);
  if (tokenResult.error) return { error: tokenResult.error };

  return { data: review, token: tokenResult.token };
}

// ─────────────────────────────────────────────
// 生成/取得 Token
// ─────────────────────────────────────────────

export async function generateReviewToken(reviewId: string) {
  const supabase = await createClient();

  // 先查是否已有 token
  const { data: existing } = await supabase
    .from("review_tokens")
    .select("token")
    .eq("review_id", reviewId)
    .single() as { data: { token: string } | null };

  if (existing?.token) return { token: existing.token };

  const { data, error } = await supabase
    .from("review_tokens")
    .insert({
      review_id: reviewId,
    } as Database["public"]["Tables"]["review_tokens"]["Insert"])
    .select("token")
    .single();

  if (error) return { error: error.message };
  return { token: data.token };
}

// ─────────────────────────────────────────────
// 客戶更新狀態（透過 token，使用 admin client）
// ─────────────────────────────────────────────

export async function updateReviewStatusByToken(
  token: string,
  status: "approved" | "revision_requested",
  comment: string,
  clientName: string
) {
  const supabase = createAdminClient();

  // 驗證 token
  const { data: tokenRow } = await supabase
    .from("review_tokens")
    .select("review_id, expires_at")
    .eq("token", token)
    .single() as { data: { review_id: string; expires_at: string | null } | null };

  if (!tokenRow) return { error: "無效的連結" };
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return { error: "連結已過期" };
  }

  // 更新狀態
  const { error: updateError } = await supabase
    .from("deliverable_reviews")
    .update({ status } as Database["public"]["Tables"]["deliverable_reviews"]["Update"])
    .eq("id", tokenRow.review_id);

  if (updateError) return { error: updateError.message };

  // 新增客戶評論
  if (comment?.trim()) {
    const { error: commentError } = await supabase
      .from("review_comments")
      .insert({
        review_id: tokenRow.review_id,
        author_type: "client",
        author_name: clientName || "客戶",
        body: comment.trim(),
      } as Database["public"]["Tables"]["review_comments"]["Insert"]);

    if (commentError) return { error: commentError.message };
  }

  // 通知 Freelancer
  try {
    const { data: review } = await supabase
      .from("deliverable_reviews")
      .select("title, project:projects(name, workspace:workspaces(name, owner_id), client:clients(name, email, portal_token))")
      .eq("id", tokenRow.review_id)
      .single();

    const project = (review as any)?.project;
    const workspace = project?.workspace;

    if (workspace?.owner_id) {
      // 取得 freelancer email
      const { data: { user } } = await supabase.auth.admin.getUserById(workspace.owner_id);
      if (user?.email) {
        await sendReviewNotification({
          to: user.email,
          recipientName: "Freelancer",
          workspaceName: workspace.name ?? "ClientSpace",
          projectName: project?.name ?? "Your project",
          reviewTitle: review?.title ?? "Deliverable",
          status,
          clientName: clientName || "客戶",
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reviews/${token}`,
        });
      }
    }
  } catch {
    // Email 失敗不阻止主流程
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// 新增評論
// ─────────────────────────────────────────────

export async function addReviewComment(reviewId: string, body: string, authorName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未登入" };

  if (!body?.trim()) return { error: "評論不能為空" };

  const { data, error } = await supabase
    .from("review_comments")
    .insert({
      review_id: reviewId,
      author_type: "freelancer",
      author_name: authorName || "Freelancer",
      body: body.trim(),
    } as Database["public"]["Tables"]["review_comments"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function addReviewCommentByToken(token: string, body: string, clientName: string) {
  const supabase = createAdminClient();

  // 驗證 token
  const { data: tokenRow } = await supabase
    .from("review_tokens")
    .select("review_id, expires_at")
    .eq("token", token)
    .single() as { data: { review_id: string; expires_at: string | null } | null };

  if (!tokenRow) return { error: "無效的連結" };

  if (!body?.trim()) return { error: "評論不能為空" };

  const { data, error } = await supabase
    .from("review_comments")
    .insert({
      review_id: tokenRow.review_id,
      author_type: "client",
      author_name: clientName || "客戶",
      body: body.trim(),
    } as Database["public"]["Tables"]["review_comments"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

// ─────────────────────────────────────────────
// 取得 Signed URL（用於 storage files）
// ─────────────────────────────────────────────

export async function getReviewFileUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}

export async function getReviewFileUrlByToken(token: string, storagePath: string) {
  const supabase = createAdminClient();

  // 驗證 token 有效
  const { data: tokenRow } = await supabase
    .from("review_tokens")
    .select("review_id")
    .eq("token", token)
    .single() as { data: { review_id: string } | null };

  if (!tokenRow) return null;

  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}
