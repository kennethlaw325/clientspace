"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type TimeEntryRow = Database["public"]["Tables"]["time_entries"]["Row"];

export async function getTimeEntries(projectId: string): Promise<TimeEntryRow[]> {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  const { data } = await supabase
    .from("time_entries")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("project_id", projectId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as TimeEntryRow[];
}

export interface TimeEntrySummary {
  totalMinutes: number;
  totalAmount: number;
  currentMonthMinutes: number;
}

export async function getTimeEntrySummary(projectId: string): Promise<TimeEntrySummary> {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { totalMinutes: 0, totalAmount: 0, currentMonthMinutes: 0 };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("time_entries")
    .select("duration_minutes, hourly_rate, date")
    .eq("workspace_id", workspace.id)
    .eq("project_id", projectId);

  const entries = (data ?? []) as Pick<TimeEntryRow, "duration_minutes" | "hourly_rate" | "date">[];
  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0);
  const totalAmount = entries.reduce((s, e) => s + (e.duration_minutes / 60) * e.hourly_rate, 0);
  const currentMonthMinutes = entries
    .filter((e) => e.date >= monthStart)
    .reduce((s, e) => s + e.duration_minutes, 0);

  return { totalMinutes, totalAmount, currentMonthMinutes };
}

export async function createTimeEntry(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const projectId = formData.get("project_id") as string;
  const description = formData.get("description") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string);
  const hourlyRate = parseFloat(formData.get("hourly_rate") as string) || 0;
  const date = formData.get("date") as string;

  if (!projectId || !description || !durationMinutes) {
    return { error: "project_id, description, duration_minutes are required" };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      workspace_id: workspace.id,
      project_id: projectId,
      description,
      duration_minutes: durationMinutes,
      hourly_rate: hourlyRate,
      date: date || new Date().toISOString().slice(0, 10),
    } as Database["public"]["Tables"]["time_entries"]["Insert"])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/time`);
  return { data };
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const description = formData.get("description") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string);
  const hourlyRate = parseFloat(formData.get("hourly_rate") as string) || 0;
  const date = formData.get("date") as string;
  const projectId = formData.get("project_id") as string;

  const { error } = await supabase
    .from("time_entries")
    .update({
      description,
      duration_minutes: durationMinutes,
      hourly_rate: hourlyRate,
      date,
    } as Database["public"]["Tables"]["time_entries"]["Update"])
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/time`);
  return { success: true };
}

export async function deleteTimeEntry(id: string, projectId: string) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/time`);
  return { success: true };
}

export async function getMonthlyTimeSummary() {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("time_entries")
    .select("project_id, duration_minutes, hourly_rate, projects(name, budget_amount, budget_type)")
    .eq("workspace_id", workspace.id)
    .gte("date", monthStart);

  if (!data) return [];

  const projectMap = new Map<
    string,
    { name: string; totalMinutes: number; totalAmount: number; budgetAmount: number | null; budgetType: string | null }
  >();

  for (const entry of data as Array<{
    project_id: string;
    duration_minutes: number;
    hourly_rate: number;
    projects: { name: string; budget_amount: number | null; budget_type: string | null } | null;
  }>) {
    const existing = projectMap.get(entry.project_id);
    const amount = (entry.duration_minutes / 60) * entry.hourly_rate;
    if (existing) {
      existing.totalMinutes += entry.duration_minutes;
      existing.totalAmount += amount;
    } else {
      projectMap.set(entry.project_id, {
        name: entry.projects?.name ?? "Unknown",
        totalMinutes: entry.duration_minutes,
        totalAmount: amount,
        budgetAmount: entry.projects?.budget_amount ?? null,
        budgetType: entry.projects?.budget_type ?? null,
      });
    }
  }

  return Array.from(projectMap.entries()).map(([projectId, info]) => ({
    projectId,
    ...info,
  }));
}
