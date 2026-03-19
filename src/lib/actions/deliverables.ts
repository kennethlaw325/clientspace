"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/email";

export async function createDeliverable(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!title) return { error: "Title is required" };

  // Get next sort order
  const { data: existing } = await supabase
    .from("deliverables")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = existing?.[0] ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("deliverables")
    .insert({ project_id: projectId, title, description: description || null, sort_order: sortOrder })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateDeliverableStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverables")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  // Notify client of status change
  try {
    const { data: deliverable } = await supabase
      .from("deliverables")
      .select("title, project:projects(name, client:clients(name, email, portal_token), workspace:workspaces(name))")
      .eq("id", id)
      .single();

    const project = (deliverable as any)?.project;
    const client = project?.client;
    const workspace = project?.workspace;

    if (client?.email && workspace?.name && project?.name) {
      await sendNotification({
        to: client.email,
        recipientName: client.name,
        workspaceName: workspace.name,
        projectName: project.name,
        type: "status_update",
        detail: `"${deliverable?.title}" has been updated to "${status}".`,
        portalUrl: client.portal_token
          ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_token}`
          : undefined,
      });
    }
  } catch {
    // Email failure should not block the status update
  }

  return { success: true };
}

export async function deleteDeliverable(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
