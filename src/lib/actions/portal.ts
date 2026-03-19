"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export async function portalUploadFile(token: string, projectId: string, formData: FormData) {
  const supabase = createAdminClient();

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("id, workspace_id:workspaces(id)")
    .eq("portal_token", token)
    .single() as { data: { id: string; workspace_id: { id: string } } | null };

  if (!client) return { error: "Invalid portal access" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file selected" };
  if (file.size > 52428800) return { error: "File must be under 50MB" };

  const workspaceId = client.workspace_id?.id;
  const storagePath = `${workspaceId}/${projectId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("files").insert({
    project_id: projectId,
    uploaded_by_type: "client" as const,
    uploaded_by_id: client.id,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type || null,
    storage_path: storagePath,
  } as Database["public"]["Tables"]["files"]["Insert"]);

  if (error) return { error: error.message };
  return { success: true };
}

export async function portalSendMessage(token: string, projectId: string, formData: FormData) {
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single() as { data: { id: string } | null };

  if (!client) return { error: "Invalid portal access" };

  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string;

  if (!content?.trim()) return { error: "Message cannot be empty" };

  const { error } = await supabase.from("messages").insert({
    project_id: projectId,
    sender_type: "client" as const,
    sender_id: client.id,
    content: content.trim(),
    parent_id: parentId || null,
  } as Database["public"]["Tables"]["messages"]["Insert"]);

  if (error) return { error: error.message };
  return { success: true };
}

export async function portalGetFileUrl(token: string, storagePath: string) {
  const supabase = createAdminClient();

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single() as { data: { id: string } | null };

  if (!client) return null;

  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? null;
}
