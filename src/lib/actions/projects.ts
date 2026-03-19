"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";
import { logActivity } from "./activity";
import type { Database } from "@/types/database";

type ProjectWithRelations = Database["public"]["Tables"]["projects"]["Row"] & {
  clients: { name: string; email: string } | null;
  deliverables: { count: number }[];
};

type ProjectWithDeliverables = Database["public"]["Tables"]["projects"]["Row"] & {
  clients: { name: string; email: string } | null;
  deliverables: Database["public"]["Tables"]["deliverables"]["Row"][];
};

export async function getProjects() {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [] as ProjectWithRelations[];

  const { data } = await supabase
    .from("projects")
    .select("*, clients(name, email), deliverables(count)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ProjectWithRelations[];
}

export async function getProject(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("*, clients(name, email), deliverables(*)")
    .eq("id", id)
    .single();

  return data as ProjectWithDeliverables | null;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const name = formData.get("name") as string;
  const clientId = formData.get("client_id") as string;
  const description = formData.get("description") as string;
  const maxRevisions = parseInt(formData.get("max_revisions") as string) || 3;
  const dueDate = formData.get("due_date") as string;

  if (!name || !clientId) return { error: "Name and client are required" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      name,
      description: description || null,
      max_revisions: maxRevisions,
      due_date: dueDate || null,
    } as Database["public"]["Tables"]["projects"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };

  if (data) {
    await logActivity({
      clientId,
      projectId: (data as { id: string }).id,
      eventType: "project_created",
      metadata: { name },
    });
  }

  return { data };
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("client_id, name")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("projects")
    .update({ status } as Database["public"]["Tables"]["projects"]["Update"])
    .eq("id", id);

  if (error) return { error: error.message };

  await logActivity({
    clientId: project?.client_id ?? undefined,
    projectId: id,
    eventType: "project_status_changed",
    metadata: { name: project?.name, status },
  });

  return { success: true };
}

export async function incrementRevision(projectId: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("used_revisions, max_revisions")
    .eq("id", projectId)
    .single();

  const proj = project as { used_revisions: number; max_revisions: number } | null;
  if (!proj) return { error: "Project not found" };

  const { error } = await supabase
    .from("projects")
    .update({ used_revisions: proj.used_revisions + 1 } as Database["public"]["Tables"]["projects"]["Update"])
    .eq("id", projectId);

  if (error) return { error: error.message };
  return { success: true, used: proj.used_revisions + 1, max: proj.max_revisions };
}
