import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/actions/invoices";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await getInvoice(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Get workspace name
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", invoice.workspace_id)
    .single();

  const workspaceName = workspace?.name ?? "ClientSpace";

  // Dynamic imports to keep @react-pdf/renderer out of the Next.js module graph
  const [pdf, { buildInvoicePDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/invoice-pdf"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = buildInvoicePDF({ invoice, workspaceName, pdf: pdf as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await pdf.renderToBuffer(element as any);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
