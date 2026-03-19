"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";
import type { Database } from "@/types/database";

type ClientWithProjectCount = Database["public"]["Tables"]["clients"]["Row"] & {
  projects: { count: number }[];
};

export async function getClients() {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [] as ClientWithProjectCount[];

  const { data } = await supabase
    .from("clients")
    .select("*, projects(count)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ClientWithProjectCount[];
}

type ClientWithProjects = Database["public"]["Tables"]["clients"]["Row"] & {
  projects: Database["public"]["Tables"]["projects"]["Row"][];
};

export async function getClient(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*, projects(*)")
    .eq("id", id)
    .single();

  return data as ClientWithProjects | null;
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;

  if (!name || !email) return { error: "Name and email are required" };

  // Check plan limits
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const limits = { free: 2, starter: 10, pro: Infinity };
  const limit = limits[workspace.plan as keyof typeof limits] ?? 2;

  if ((count ?? 0) >= limit) {
    return { error: `You've reached your ${workspace.plan} plan limit of ${limit} clients. Upgrade to add more.` };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      workspace_id: workspace.id,
      name,
      email,
      company: company || null,
    } as Database["public"]["Tables"]["clients"]["Insert"])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A client with this email already exists" };
    return { error: error.message };
  }

  return { data };
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;

  const { error } = await supabase
    .from("clients")
    .update({ name, email, company: company || null } as Database["public"]["Tables"]["clients"]["Update"])
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getPortalUrl(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("portal_token")
    .eq("id", clientId)
    .single();

  if (!data) return null;
  return `${process.env.NEXT_PUBLIC_APP_URL}/portal/${data.portal_token}`;
}

export async function regeneratePortalToken(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ portal_token: crypto.randomUUID() } as Database["public"]["Tables"]["clients"]["Update"])
    .eq("id", clientId);

  if (error) return { error: error.message };
  return { success: true };
}
