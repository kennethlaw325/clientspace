import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { getProjects } from "@/lib/actions/projects";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [clients, projects] = await Promise.all([getClients(), getProjects()]);

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Link>
        <h1 className="text-2xl font-bold">New Invoice</h1>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <InvoiceForm clients={clientOptions} projects={projectOptions} />
      </div>
    </div>
  );
}
