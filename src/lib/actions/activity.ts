"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";
import type { Database, ActivityLog } from "@/types/database";

type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export async function logActivity(params: {
  clientId?: string;
  projectId?: string;
  actorType?: "freelancer" | "client" | "system";
  actorId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const workspace = await getWorkspace();
    if (!workspace) return;

    await supabase.from("activity_logs").insert({
      workspace_id: workspace.id,
      client_id: params.clientId ?? null,
      project_id: params.projectId ?? null,
      actor_type: params.actorType ?? "freelancer",
      actor_id: params.actorId ?? null,
      event_type: params.eventType,
      metadata: params.metadata ?? null,
    } as ActivityLogInsert);
  } catch {
    // Activity logging should not break main flows
  }
}

export async function getWorkspaceActivity(limit = 50): Promise<ActivityLog[]> {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ActivityLog[];
}

export async function getClientActivity(clientId: string, limit = 50): Promise<ActivityLog[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ActivityLog[];
}
