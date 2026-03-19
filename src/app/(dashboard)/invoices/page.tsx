export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileText, RefreshCw } from "lucide-react";
import { getInvoices } from "@/lib/actions/invoices";
import { getClients } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { formatDate } from "@/lib/utils";

interface SearchParams {
  status?: string;
  clientId?: string;
  from?: string;
  to?: string;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const [invoices, clients] = await Promise.all([
    getInvoices(filters),
    getClients(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-6">
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          name="clientId"
          defaultValue={filters.clientId ?? ""}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          placeholder="From"
        />
        <input
          type="date"
          name="to"
          defaultValue={filters.to ?? ""}
          className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          placeholder="To"
        />
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        <Link href="/invoices">
          <Button type="button" variant="ghost" size="sm">
            Clear
          </Button>
        </Link>
      </form>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="mb-4">No invoices yet.</p>
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create your first invoice
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden space-y-3">
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                <div className="border rounded-lg bg-white p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-indigo-600">{invoice.invoice_number}</span>
                      {invoice.is_recurring && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
                          <RefreshCw className="h-3 w-3" />
                          Recurring
                        </span>
                      )}
                    </div>
                    <InvoiceStatusBadge
                      status={invoice.status as "draft" | "sent" | "paid" | "overdue" | "cancelled"}
                    />
                  </div>
                  <div className="text-sm text-slate-700 mb-1">{invoice.clients?.name ?? "—"}</div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{invoice.due_date ? formatDate(invoice.due_date) : "No due date"}</span>
                    <span className="font-medium text-slate-900">${invoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {invoice.invoice_number}
                        </Link>
                        {invoice.is_recurring && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">
                            <RefreshCw className="h-3 w-3" />
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {invoice.clients?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {invoice.projects?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge
                        status={invoice.status as "draft" | "sent" | "paid" | "overdue" | "cancelled"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
