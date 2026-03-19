import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/invoices/check-overdue
// 查詢所有 status=sent 且 due_date < now() 的發票，自動更新為 overdue
export async function POST() {
  const admin = createAdminClient();

  // 找出所有逾期發票
  const { data: overdueInvoices, error: fetchError } = await admin
    .from("invoices")
    .select("id, invoice_number, workspace_id")
    .eq("status", "sent")
    .lt("due_date", new Date().toISOString().split("T")[0]);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!overdueInvoices || overdueInvoices.length === 0) {
    return NextResponse.json({ updated: 0, invoices: [] });
  }

  const ids = overdueInvoices.map((inv) => inv.id);

  // 批次更新狀態為 overdue
  const { error: updateError } = await admin
    .from("invoices")
    .update({ status: "overdue" })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 記錄 activity_log
  const activityRows = overdueInvoices.map((inv) => ({
    workspace_id: inv.workspace_id,
    actor_type: "system" as const,
    event_type: "invoice_overdue",
    metadata: { invoice_id: inv.id, invoice_number: inv.invoice_number },
  }));

  await admin.from("activity_logs").insert(activityRows);

  return NextResponse.json({
    updated: overdueInvoices.length,
    invoices: overdueInvoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
    })),
  });
}
