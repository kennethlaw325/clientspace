"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/email";
import type { Database } from "@/types/database";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export async function getProjectMessages(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .is("parent_id", null)
    .order("created_at", { ascending: true });

  const messages = (data ?? []) as MessageRow[];
  if (messages.length === 0) return [];

  // Fetch replies for each message
  const messageIds = messages.map((m) => m.id);
  const { data: repliesData } = await supabase
    .from("messages")
    .select("*")
    .in("parent_id", messageIds)
    .order("created_at", { ascending: true });

  const replies = (repliesData ?? []) as MessageRow[];

  return messages.map((msg) => ({
    ...msg,
    replies: replies.filter((r) => r.parent_id === msg.id),
  }));
}

export async function sendMessage(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const content = formData.get("content") as string;
  const parentId = formData.get("parent_id") as string;

  if (!content?.trim()) return { error: "Message cannot be empty" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      sender_type: "freelancer" as const,
      sender_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    } as Database["public"]["Tables"]["messages"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };

  // Notify client when freelancer sends a message
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("name, client:clients(name, email, portal_token), workspace:workspaces(name)")
      .eq("id", projectId)
      .single();

    const client = (project as any)?.client;
    const workspace = (project as any)?.workspace;

    if (client?.email && workspace?.name && project?.name) {
      await sendNotification({
        to: client.email,
        recipientName: client.name,
        workspaceName: workspace.name,
        projectName: project.name,
        type: "new_message",
        detail: `You have a new message: "${content.trim().slice(0, 100)}${content.trim().length > 100 ? "..." : ""}"`,
        portalUrl: client.portal_token
          ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_token}`
          : undefined,
      });
    }
  } catch {
    // Email failure should not block message sending
  }

  return { data };
}
