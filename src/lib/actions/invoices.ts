"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspace } from "./workspaces";
import { getStripe } from "@/lib/stripe";
import { sendNotification } from "@/lib/email";
import { sendInvoiceSentEmail, sendPaymentReceivedEmail, sendPaymentReminderEmail } from "@/lib/notifications";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];

export type InvoiceWithRelations = InvoiceRow & {
  clients: { name: string; email: string; company: string | null } | null;
  projects: { name: string } | null;
  invoice_items: InvoiceItemRow[];
};

export type InvoiceListItem = InvoiceRow & {
  clients: { name: string; email: string } | null;
  projects: { name: string } | null;
};

export interface InvoiceItemInput {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotal(items: InvoiceItemInput[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return subtotal * (1 + taxRate / 100);
}

async function nextInvoiceNumber(workspaceId: string): Promise<string> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  const num = (count ?? 0) + 1;
  return `INV-${String(num).padStart(4, "0")}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getInvoices(filters?: {
  status?: string;
  clientId?: string;
  from?: string;
  to?: string;
}): Promise<InvoiceListItem[]> {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return [];

  let query = supabase
    .from("invoices")
    .select("*, clients(name, email), projects(name)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status as "draft" | "sent" | "paid" | "overdue" | "cancelled");
  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data } = await query;
  return (data ?? []) as InvoiceListItem[];
}

export async function getInvoice(id: string): Promise<InvoiceWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name, email, company), projects(name), invoice_items(*)")
    .eq("id", id)
    .single();
  return data as InvoiceWithRelations | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const clientId = formData.get("client_id") as string;
  const projectId = formData.get("project_id") as string | null;
  const dueDate = formData.get("due_date") as string | null;
  const taxRate = parseFloat(formData.get("tax_rate") as string) || 0;
  const notes = formData.get("notes") as string | null;
  const itemsJson = formData.get("items") as string;

  // Recurring fields
  const isRecurring = formData.get("is_recurring") === "true";
  const recurringFrequency = (formData.get("recurring_frequency") as "monthly" | "quarterly" | "yearly" | null) || null;
  const recurringNextDate = formData.get("recurring_next_date") as string | null;
  const recurringEndDate = formData.get("recurring_end_date") as string | null;

  if (!clientId) return { error: "Client is required" };
  if (isRecurring && !recurringFrequency) return { error: "Recurring frequency is required" };
  if (isRecurring && !recurringNextDate) return { error: "Next invoice date is required for recurring invoices" };

  let items: InvoiceItemInput[] = [];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Invalid line items" };
  }

  if (items.length === 0) return { error: "At least one line item is required" };

  const invoiceNumber = await nextInvoiceNumber(workspace.id);
  const totalAmount = calcTotal(items, taxRate);

  const { data: invoiceRow, error } = await supabase
    .from("invoices")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      project_id: projectId || null,
      invoice_number: invoiceNumber,
      due_date: dueDate || null,
      tax_rate: taxRate,
      notes: notes || null,
      total_amount: totalAmount,
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? recurringFrequency : null,
      recurring_next_date: isRecurring ? (recurringNextDate || null) : null,
      recurring_end_date: isRecurring ? (recurringEndDate || null) : null,
    })
    .select()
    .single();
  const invoice = invoiceRow as InvoiceRow | null;

  if (error || !invoice) return { error: error?.message ?? "Failed to create invoice" };

  const itemRows = items.map((item, idx) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: idx,
  }));

  await supabase.from("invoice_items").insert(itemRows);

  revalidatePath("/invoices");
  return { data: invoice };
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient();

  const dueDate = formData.get("due_date") as string | null;
  const taxRate = parseFloat(formData.get("tax_rate") as string) || 0;
  const notes = formData.get("notes") as string | null;
  const itemsJson = formData.get("items") as string;

  // Recurring fields
  const isRecurring = formData.get("is_recurring") === "true";
  const recurringFrequency = (formData.get("recurring_frequency") as "monthly" | "quarterly" | "yearly" | null) || null;
  const recurringNextDate = formData.get("recurring_next_date") as string | null;
  const recurringEndDate = formData.get("recurring_end_date") as string | null;

  let items: InvoiceItemInput[] = [];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Invalid line items" };
  }

  const totalAmount = calcTotal(items, taxRate);

  const { error } = await supabase
    .from("invoices")
    .update({
      due_date: dueDate || null,
      tax_rate: taxRate,
      notes: notes || null,
      total_amount: totalAmount,
      is_recurring: isRecurring,
      recurring_frequency: isRecurring ? recurringFrequency : null,
      recurring_next_date: isRecurring ? (recurringNextDate || null) : null,
      recurring_end_date: isRecurring ? (recurringEndDate || null) : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Replace all items
  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  const itemRows = items.map((item, idx) => ({
    invoice_id: id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: idx,
  }));
  await supabase.from("invoice_items").insert(itemRows);

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function sendInvoice(id: string) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const invoice = await getInvoice(id);
  if (!invoice) return { error: "Invoice not found" };
  if (!invoice.clients) return { error: "Client not found" };

  let paymentLink = invoice.stripe_payment_link;

  // Generate Stripe Payment Link if not already created
  if (!paymentLink) {
    try {
      const stripe = getStripe();
      const priceData = {
        currency: "usd",
        product_data: { name: `Invoice ${invoice.invoice_number}` },
        unit_amount: Math.round(invoice.total_amount * 100),
      };

      const link = await stripe.paymentLinks.create({
        line_items: [{ price_data: priceData, quantity: 1 }],
        metadata: { invoice_id: id, workspace_id: workspace.id },
        after_completion: {
          type: "hosted_confirmation",
          hosted_confirmation: { custom_message: "Thank you for your payment!" },
        },
      });

      paymentLink = link.url;
      await supabase
        .from("invoices")
        .update({ stripe_payment_link: paymentLink, status: "sent" })
        .eq("id", id);
    } catch (err) {
      console.error("Stripe payment link creation failed:", err);
      // Still send the invoice without payment link
      await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
    }
  } else {
    await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
  }

  // Send email (React Email template)
  try {
    await sendInvoiceSentEmail({
      to: invoice.clients.email,
      recipientName: invoice.clients.name,
      workspaceName: workspace.name,
      invoiceNumber: invoice.invoice_number,
      amount: `$${invoice.total_amount.toFixed(2)}`,
      projectName: invoice.projects?.name,
      paymentLink: paymentLink ?? undefined,
      dueDate: invoice.due_date ?? undefined,
    });
  } catch {
    // fallback to legacy email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const detail = paymentLink
      ? `Your invoice <strong>${invoice.invoice_number}</strong> for <strong>$${invoice.total_amount.toFixed(2)}</strong> is ready. <a href="${paymentLink}">Pay Now</a>`
      : `Your invoice <strong>${invoice.invoice_number}</strong> for <strong>$${invoice.total_amount.toFixed(2)}</strong> is ready.`;
    await sendNotification({
      to: invoice.clients.email,
      recipientName: invoice.clients.name,
      workspaceName: workspace.name,
      projectName: invoice.projects?.name ?? "Invoice",
      type: "status_update",
      detail,
      portalUrl: paymentLink ?? appUrl,
    });
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  return { success: true };
}

export async function sendPaymentReminder(id: string) {
  const supabase = await createClient();
  const workspace = await getWorkspace();
  if (!workspace) return { error: "No workspace found" };

  const invoice = await getInvoice(id);
  if (!invoice) return { error: "Invoice not found" };
  if (!invoice.clients) return { error: "Client not found" };
  if (invoice.status !== "sent" && invoice.status !== "overdue") {
    return { error: "Can only send reminders for sent or overdue invoices" };
  }

  try {
    await sendPaymentReminderEmail({
      to: invoice.clients.email,
      recipientName: invoice.clients.name,
      workspaceName: workspace.name,
      invoiceNumber: invoice.invoice_number,
      amount: `$${invoice.total_amount.toFixed(2)}`,
      dueDate: invoice.due_date ?? undefined,
      projectName: invoice.projects?.name,
      paymentLink: invoice.stripe_payment_link ?? undefined,
    });
  } catch (err) {
    console.error("Payment reminder email failed:", err);
    return { error: "Failed to send reminder email" };
  }

  // 記錄提醒發送時間到 activity_log
  await supabase.from("activity_logs").insert({
    workspace_id: workspace.id,
    client_id: invoice.client_id,
    project_id: invoice.project_id,
    actor_type: "freelancer",
    event_type: "invoice_reminder_sent",
    metadata: {
      invoice_id: id,
      invoice_number: invoice.invoice_number,
      sent_at: new Date().toISOString(),
    },
  });

  revalidatePath(`/invoices/${id}`);
  return { success: true };
}

export async function markInvoicePaid(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("invoices").update({ status: "paid" }).eq("id", id);
  if (error) return { error: error.message };

  // 通知 freelancer 收款
  try {
    type InvoiceWithJoins = {
      invoice_number: string;
      total_amount: number;
      clients: { name: string } | null;
      projects: { name: string } | null;
      workspaces: { name: string; owner_id: string } | null;
    };
    const inv = await admin
      .from("invoices")
      .select("invoice_number, total_amount, clients(name), projects(name), workspaces(name, owner_id)")
      .eq("id", id)
      .single();
    const invoiceData = inv.data as unknown as InvoiceWithJoins | null;
    if (invoiceData?.workspaces?.owner_id) {
      const { data: { user: owner } } = await admin.auth.admin.getUserById(invoiceData.workspaces.owner_id);
      if (owner?.email) {
        await sendPaymentReceivedEmail({
          userId: invoiceData.workspaces.owner_id,
          to: owner.email,
          recipientName: "Freelancer",
          workspaceName: invoiceData.workspaces.name,
          invoiceNumber: invoiceData.invoice_number,
          amount: `$${invoiceData.total_amount.toFixed(2)}`,
          projectName: invoiceData.projects?.name,
          clientName: invoiceData.clients?.name,
        });
      }
    }
  } catch {
    // Email 失敗不阻止主流程
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}

// ─── Recurring Invoice Generation ─────────────────────────────────────────────

function addFrequency(date: Date, frequency: "monthly" | "quarterly" | "yearly"): Date {
  const next = new Date(date);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else if (frequency === "quarterly") next.setMonth(next.getMonth() + 3);
  else if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export async function generateRecurringInvoices(): Promise<{ generated: number; errors: string[] }> {
  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Fetch all recurring invoices due today or earlier
  const { data: dueInvoices, error } = await admin
    .from("invoices")
    .select("*, invoice_items(*), clients(name, email), workspaces(name, owner_id)")
    .eq("is_recurring", true)
    .lte("recurring_next_date", todayStr)
    .not("recurring_next_date", "is", null);

  if (error || !dueInvoices) return { generated: 0, errors: [error?.message ?? "Query failed"] };

  const errors: string[] = [];
  let generated = 0;

  for (const parent of dueInvoices) {
    try {
      // Skip if past end date
      if (parent.recurring_end_date && parent.recurring_end_date < todayStr) {
        await admin
          .from("invoices")
          .update({ is_recurring: false, recurring_next_date: null })
          .eq("id", parent.id);
        continue;
      }

      const frequency = parent.recurring_frequency as "monthly" | "quarterly" | "yearly";

      // Count existing invoices for new number
      const { count } = await admin
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", parent.workspace_id);
      const newInvoiceNumber = `INV-${String((count ?? 0) + 1).padStart(4, "0")}`;

      // Calculate new due_date based on offset from recurring_next_date
      let newDueDate: string | null = null;
      if (parent.due_date && parent.recurring_next_date) {
        const parentDue = new Date(parent.due_date);
        const parentNext = new Date(parent.recurring_next_date);
        const offsetDays = Math.round((parentDue.getTime() - parentNext.getTime()) / (1000 * 60 * 60 * 24));
        const newDueDateObj = new Date(today);
        newDueDateObj.setDate(newDueDateObj.getDate() + offsetDays);
        newDueDate = newDueDateObj.toISOString().split("T")[0];
      }

      // Create the new invoice
      const { data: newInvoice, error: createError } = await admin
        .from("invoices")
        .insert({
          workspace_id: parent.workspace_id,
          client_id: parent.client_id,
          project_id: parent.project_id,
          invoice_number: newInvoiceNumber,
          status: "draft" as const,
          due_date: newDueDate,
          tax_rate: parent.tax_rate,
          notes: parent.notes,
          total_amount: parent.total_amount,
          is_recurring: false,
          recurring_parent_id: parent.id,
        })
        .select()
        .single();

      if (createError || !newInvoice) {
        errors.push(`Failed to create invoice from ${parent.invoice_number}: ${createError?.message}`);
        continue;
      }

      // Copy line items
      const itemRows = (parent.invoice_items as InvoiceItemRow[]).map((item, idx) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: idx,
      }));
      await admin.from("invoice_items").insert(itemRows);

      // Update parent's next recurring date
      const nextDate = addFrequency(new Date(parent.recurring_next_date!), frequency);
      await admin
        .from("invoices")
        .update({ recurring_next_date: nextDate.toISOString().split("T")[0] })
        .eq("id", parent.id);

      // Send notification email to client
      type WorkspaceRef = { name: string; owner_id: string } | null;
      type ClientRef = { name: string; email: string } | null;
      const workspace = parent.workspaces as unknown as WorkspaceRef;
      const client = parent.clients as unknown as ClientRef;
      if (client?.email && workspace?.name) {
        try {
          await sendInvoiceSentEmail({
            to: client.email,
            recipientName: client.name,
            workspaceName: workspace.name,
            invoiceNumber: newInvoiceNumber,
            amount: `$${parent.total_amount.toFixed(2)}`,
            dueDate: newDueDate ?? undefined,
          });
        } catch {
          // Email 失敗不阻止主流程
        }
      }

      generated++;
    } catch (err) {
      errors.push(`Error processing ${parent.invoice_number}: ${String(err)}`);
    }
  }

  revalidatePath("/invoices");
  return { generated, errors };
}

export async function getRecurringHistory(parentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total_amount, created_at, due_date")
    .eq("recurring_parent_id", parentId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
