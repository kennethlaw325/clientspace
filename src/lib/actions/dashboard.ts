"use server";

import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "./workspaces";
import type { ActivityLog } from "@/types/database";

export interface DashboardStats {
  monthlyRevenue: number;
  pendingReceivables: number;
  activeProjects: number;
  activeClients: number;
}

export interface PendingItem {
  id: string;
  type: "overdue_invoice" | "pending_review";
  title: string;
  subtitle: string;
  href: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityLog[];
  pendingItems: PendingItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const workspace = await getWorkspace();

  if (!workspace) {
    return {
      stats: { monthlyRevenue: 0, pendingReceivables: 0, activeProjects: 0, activeClients: 0 },
      recentActivity: [],
      pendingItems: [],
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    paidInvoicesResult,
    sentInvoicesResult,
    activeProjectsResult,
    activeClientsResult,
    activityResult,
    overdueInvoicesResult,
    pendingReviewsResult,
  ] = await Promise.all([
    // 本月已付發票總額
    supabase
      .from("invoices")
      .select("total_amount")
      .eq("workspace_id", workspace.id)
      .eq("status", "paid")
      .gte("updated_at", monthStart),

    // 待收款（已發送未付）
    supabase
      .from("invoices")
      .select("total_amount")
      .eq("workspace_id", workspace.id)
      .in("status", ["sent"]),

    // 活躍專案數量
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "active"),

    // 活躍客戶數量
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .is("archived_at", null),

    // 最近 5 條 activity
    supabase
      .from("activity_logs")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(5),

    // 逾期發票
    supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, clients(name)")
      .eq("workspace_id", workspace.id)
      .eq("status", "overdue")
      .order("due_date", { ascending: true })
      .limit(5),

    // 待審批 deliverables (status = review)
    supabase
      .from("deliverables")
      .select("id, title, projects!inner(id, name, workspace_id)")
      .eq("projects.workspace_id", workspace.id)
      .eq("status", "review")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const monthlyRevenue = (paidInvoicesResult.data ?? []).reduce(
    (sum, inv) => sum + (inv.total_amount ?? 0),
    0
  );
  const pendingReceivables = (sentInvoicesResult.data ?? []).reduce(
    (sum, inv) => sum + (inv.total_amount ?? 0),
    0
  );

  const pendingItems: PendingItem[] = [
    ...((overdueInvoicesResult.data ?? []) as Array<{
      id: string;
      invoice_number: string;
      total_amount: number;
      clients: { name: string } | null;
    }>).map((inv) => ({
      id: inv.id,
      type: "overdue_invoice" as const,
      title: `Invoice ${inv.invoice_number} 逾期`,
      subtitle: `${(inv.clients as { name: string } | null)?.name ?? "Unknown"} · $${inv.total_amount.toFixed(2)}`,
      href: `/invoices/${inv.id}`,
    })),
    ...((pendingReviewsResult.data ?? []) as Array<{
      id: string;
      title: string;
      projects: { id: string; name: string } | null;
    }>).map((d) => ({
      id: d.id,
      type: "pending_review" as const,
      title: `${d.title} 待審批`,
      subtitle: (d.projects as { id: string; name: string } | null)?.name ?? "Unknown Project",
      href: `/projects/${(d.projects as { id: string; name: string } | null)?.id ?? ""}`,
    })),
  ];

  return {
    stats: {
      monthlyRevenue,
      pendingReceivables,
      activeProjects: activeProjectsResult.count ?? 0,
      activeClients: activeClientsResult.count ?? 0,
    },
    recentActivity: (activityResult.data ?? []) as ActivityLog[],
    pendingItems,
  };
}
