"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/email";
import { logActivity } from "./activity";
import type { Database } from "@/types/database";

type FileRow = Database["public"]["Tables"]["files"]["Row"];

export async function getProjectFiles(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (data ?? []) as FileRow[];
}

type FileRowWithProject = FileRow & { projects: { name: string; client_id: string } | null };

export async function getClientFiles(clientId: string) {
  const supabase = await createClient();

  // Get all projects for this client first
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", clientId);

  if (!projects || projects.length === 0) return [] as FileRowWithProject[];

  const projectIds = projects.map((p) => p.id);

  const { data } = await supabase
    .from("files")
    .select("*, projects(name, client_id)")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  return (data ?? []) as FileRowWithProject[];
}

export async function uploadFile(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file selected" };

  // Check file size (50MB limit)
  if (file.size > 52428800) {
    return { error: "File size must be under 50MB" };
  }

  // Get workspace ID for storage path
  const { data: project } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single() as { data: { workspace_id: string } | null };

  if (!project) return { error: "Project not found" };

  const storagePath = `${project.workspace_id}/${projectId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  // Check for existing file with same name (versioning)
  const { data: existing } = await supabase
    .from("files")
    .select("version")
    .eq("project_id", projectId)
    .eq("file_name", file.name)
    .order("version", { ascending: false })
    .limit(1) as { data: { version: number }[] | null };

  const version = existing?.[0] ? existing[0].version + 1 : 1;

  // Create file record
  const { data, error } = await supabase
    .from("files")
    .insert({
      project_id: projectId,
      uploaded_by_type: "freelancer" as const,
      uploaded_by_id: user.id,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      storage_path: storagePath,
      version,
    } as Database["public"]["Tables"]["files"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };

  // Notify client when freelancer uploads a file
  try {
    const { data: projectInfo } = await supabase
      .from("projects")
      .select("name, client:clients(name, email, portal_token), workspace:workspaces(name)")
      .eq("id", projectId)
      .single();

    const client = (projectInfo as any)?.client;
    const workspace = (projectInfo as any)?.workspace;

    if (client?.email && workspace?.name && projectInfo?.name) {
      await sendNotification({
        to: client.email,
        recipientName: client.name,
        workspaceName: workspace.name,
        projectName: projectInfo.name,
        type: "new_file",
        detail: `A new file "${file.name}" has been uploaded to your project.`,
        portalUrl: client.portal_token
          ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_token}`
          : undefined,
      });
    }
  } catch {
    // Email failure should not block file upload
  }

  // Log activity
  try {
    const { data: proj } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single() as { data: { client_id: string } | null };

    await logActivity({
      clientId: proj?.client_id ?? undefined,
      projectId,
      actorId: user.id,
      eventType: "file_uploaded",
      metadata: { file_name: file.name, file_size: file.size, version },
    });
  } catch {
    // Activity logging should not block file upload
  }

  return { data };
}

export async function getFileUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  return data?.signedUrl ?? null;
}

export async function deleteFile(id: string, storagePath: string) {
  const supabase = await createClient();

  await supabase.storage.from("project-files").remove([storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
