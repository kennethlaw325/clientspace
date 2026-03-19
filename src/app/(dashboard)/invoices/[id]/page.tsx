export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Briefcase } from "lucide-react";
import { getInvoice } from "@/lib/actions/invoices";
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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
              <InvoiceStatusBadge
                status={invoice.status as "draft" | "sent" | "paid" | "overdue" | "cancelled"}
              />
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
      </div>
    </div>
  );
}
