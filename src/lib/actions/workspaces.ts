"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";
import type { Database } from "@/types/database";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

export async function getWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return data as Workspace | null;
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  if (!name) return { error: "Workspace name is required" };

  const slug = generateSlug(name);

  const { error } = await supabase.from("workspaces").insert({
    owner_id: user.id,
    name,
    slug,
  } as Database["public"]["Tables"]["workspaces"]["Insert"]);

  if (error) {
    if (error.code === "23505") {
      return { error: "This workspace name is taken. Try another." };
    }
    return { error: error.message };
  }

  redirect("/projects");
}

export async function updateWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const brandColor = formData.get("brand_color") as string;

  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (brandColor) updates.brand_color = brandColor;

  const { error } = await supabase
    .from("workspaces")
    .update(updates as Database["public"]["Tables"]["workspaces"]["Update"])
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadLogo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("logo") as File;
  if (!file) return { error: "No file selected" };

  const path = `${user.id}/logo_${Date.now()}.${file.name.split(".").pop()}`;

  const { error: uploadError } = await supabase.storage
    .from("workspace-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("workspace-logos")
    .getPublicUrl(path);

  const { error } = await supabase
    .from("workspaces")
    .update({ logo_url: publicUrl } as Database["public"]["Tables"]["workspaces"]["Update"])
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { url: publicUrl };
}
