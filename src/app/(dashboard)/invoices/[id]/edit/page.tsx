export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInvoice } from "@/lib/actions/invoices";
import { getProjects } from "@/lib/actions/projects";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, projects] = await Promise.all([getInvoice(id), getProjects()]);
  if (!invoice) notFound();

  // Only allow editing draft/sent invoices
  if (!["draft", "sent"].includes(invoice.status)) notFound();

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/invoices/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoice
        </Link>
        <h1 className="text-2xl font-bold">Edit {invoice.invoice_number}</h1>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <InvoiceForm clients={[]} projects={projectOptions} invoice={invoice} />
      </div>
    </div>
  );
}
