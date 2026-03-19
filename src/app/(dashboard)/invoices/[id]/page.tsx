export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Briefcase, RefreshCw } from "lucide-react";
import { getInvoice, getRecurringHistory } from "@/lib/actions/invoices";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { formatDate } from "@/lib/utils";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const subtotal = invoice.invoice_items.reduce((sum, item) => sum + item.amount, 0);
  const recurringHistory = invoice.is_recurring ? await getRecurringHistory(invoice.id) : [];
  const taxAmount = subtotal * (invoice.tax_rate / 100);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link + header */}
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
              <InvoiceStatusBadge
                status={invoice.status as "draft" | "sent" | "paid" | "overdue" | "cancelled"}
              />
              {invoice.is_recurring && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                  <RefreshCw className="h-3 w-3" />
                  {invoice.recurring_frequency === "monthly" ? "Monthly" :
                   invoice.recurring_frequency === "quarterly" ? "Quarterly" : "Yearly"} Recurring
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
              {invoice.clients && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {invoice.clients.name}
                </span>
              )}
              {invoice.projects && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {invoice.projects.name}
                </span>
              )}
              {invoice.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {formatDate(invoice.due_date)}
                </span>
              )}
            </div>
          </div>
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            invoiceNumber={invoice.invoice_number}
            stripePaymentLink={invoice.stripe_payment_link}
          />
        </div>
      </div>

      {/* Invoice Body */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Line Items */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Line Items
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.invoice_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 mt-4 text-sm">
            <div className="flex gap-12">
              <span className="text-slate-500">Subtotal</span>
              <span className="w-24 text-right">${subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex gap-12">
                <span className="text-slate-500">Tax ({invoice.tax_rate}%)</span>
                <span className="w-24 text-right">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex gap-12 font-bold text-base border-t pt-2 mt-1">
              <span>Total</span>
              <span className="w-24 text-right text-indigo-600">
                ${invoice.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 pb-6 border-t pt-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Link */}
        {invoice.stripe_payment_link && (
          <div className="px-6 pb-6 border-t pt-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Payment Link
            </h2>
            <a
              href={invoice.stripe_payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 break-all"
            >
              {invoice.stripe_payment_link}
            </a>
          </div>
        )}

        {/* Recurring Info */}
        {invoice.is_recurring && (
          <div className="px-6 pb-6 border-t pt-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recurring Schedule
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-0.5">Frequency</p>
                <p className="font-medium capitalize">{invoice.recurring_frequency}</p>
              </div>
              {invoice.recurring_next_date && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Next Invoice</p>
                  <p className="font-medium">{formatDate(invoice.recurring_next_date)}</p>
                </div>
              )}
              {invoice.recurring_end_date && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">End Date</p>
                  <p className="font-medium">{formatDate(invoice.recurring_end_date)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recurring History */}
      {recurringHistory.length > 0 && (
        <div className="mt-6 bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Generated Invoices ({recurringHistory.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recurringHistory.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${child.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                      {child.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(child.created_at)}</td>
                  <td className="px-4 py-3 text-slate-500">{child.due_date ? formatDate(child.due_date) : "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">${child.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={child.status as "draft" | "sent" | "paid" | "overdue" | "cancelled"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
