"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspace } from "./workspaces";
import { getStripe } from "@/lib/stripe";
import { sendNotification } from "@/lib/email";
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

  if (!clientId) return { error: "Client is required" };

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

  // Send email
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

export async function markInvoicePaid(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("invoices").update({ status: "paid" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}
