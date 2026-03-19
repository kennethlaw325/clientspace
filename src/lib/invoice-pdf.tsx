/**
 * Invoice PDF template - uses createElement to avoid JSX transform issues
 * with @react-pdf/renderer's custom JSX runtime
 */
import React from "react";
import type { InvoiceWithRelations } from "@/lib/actions/invoices";

/* eslint-disable @typescript-eslint/no-explicit-any */
type StyleSheet = Record<string, any>;

function createStyles(pdf: any): StyleSheet {
  return pdf.StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: 48,
      paddingBottom: 48,
      paddingHorizontal: 56,
      color: "#1e293b",
    },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
    brandName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#6366f1" },
    invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1e293b" },
    invoiceNumber: { fontSize: 12, color: "#64748b", textAlign: "right", marginTop: 2 },
    infoRow: { flexDirection: "row", gap: 48, marginBottom: 24 },
    infoBlock: { flex: 1 },
    infoLabel: { fontSize: 9, color: "#64748b", marginBottom: 2 },
    infoValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
    sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", letterSpacing: 1, marginBottom: 4 },
    tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginBottom: 4 },
    tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    colDescription: { flex: 4 },
    colQty: { flex: 1, textAlign: "right" },
    colUnitPrice: { flex: 2, textAlign: "right" },
    colAmount: { flex: 2, textAlign: "right" },
    headerCell: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b" },
    cellText: { fontSize: 10, color: "#1e293b" },
    totalsSection: { alignItems: "flex-end", marginTop: 8 },
    totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginBottom: 4 },
    totalLabel: { fontSize: 10, color: "#64748b", width: 100, textAlign: "right" },
    totalValue: { fontSize: 10, width: 80, textAlign: "right" },
    grandTotalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", width: 100, textAlign: "right" },
    grandTotalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", width: 80, textAlign: "right", color: "#6366f1" },
    notes: { marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
    notesLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", marginBottom: 4 },
    notesText: { fontSize: 10, color: "#475569" },
    paymentLink: { marginTop: 16, padding: 12, backgroundColor: "#eef2ff", borderRadius: 4 },
    paymentLinkLabel: { fontSize: 9, color: "#6366f1", fontFamily: "Helvetica-Bold" },
    paymentLinkUrl: { fontSize: 9, color: "#4338ca", marginTop: 2 },
    footer: { position: "absolute", bottom: 24, left: 56, right: 56, textAlign: "center", fontSize: 8, color: "#94a3b8" },
  });
}

function ce(type: any, props?: any, ...children: any[]) {
  return React.createElement(type, props, ...children);
}

interface InvoicePDFProps {
  invoice: InvoiceWithRelations;
  workspaceName: string;
  pdf: any; // @react-pdf/renderer module passed in
}

export function buildInvoicePDF({ invoice, workspaceName, pdf }: InvoicePDFProps) {
  const { Document, Page, Text, View } = pdf;
  const s = createStyles(pdf);
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const subtotal = invoice.invoice_items.reduce((sum, i) => sum + i.amount, 0);
  const taxAmount = subtotal * (invoice.tax_rate / 100);

  return ce(Document, null,
    ce(Page, { size: "A4", style: s.page },
      ce(View, { style: s.header },
        ce(Text, { style: s.brandName }, workspaceName),
        ce(View, null,
          ce(Text, { style: s.invoiceTitle }, "INVOICE"),
          ce(Text, { style: s.invoiceNumber }, invoice.invoice_number)
        )
      ),
      ce(View, { style: s.infoRow },
        ce(View, { style: s.infoBlock },
          ce(Text, { style: s.sectionTitle }, "Billed To"),
          ce(Text, { style: s.infoValue }, invoice.clients?.name ?? ""),
          invoice.clients?.company ? ce(Text, { style: s.infoLabel }, invoice.clients.company) : null,
          ce(Text, { style: s.infoLabel }, invoice.clients?.email ?? "")
        ),
        ce(View, { style: s.infoBlock },
          ce(View, { style: { marginBottom: 8 } },
            ce(Text, { style: s.infoLabel }, "Issue Date"),
            ce(Text, { style: s.infoValue }, new Date(invoice.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
          ),
          invoice.due_date ? ce(View, null,
            ce(Text, { style: s.infoLabel }, "Due Date"),
            ce(Text, { style: s.infoValue }, new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
          ) : null
        ),
        invoice.projects ? ce(View, { style: s.infoBlock },
          ce(Text, { style: s.infoLabel }, "Project"),
          ce(Text, { style: s.infoValue }, invoice.projects.name)
        ) : null
      ),
      ce(View, { style: { width: "100%", marginBottom: 16 } },
        ce(View, { style: s.tableHeader },
          ce(Text, { style: [s.headerCell, s.colDescription] }, "Description"),
          ce(Text, { style: [s.headerCell, s.colQty] }, "Qty"),
          ce(Text, { style: [s.headerCell, s.colUnitPrice] }, "Unit Price"),
          ce(Text, { style: [s.headerCell, s.colAmount] }, "Amount")
        ),
        ...invoice.invoice_items.map((item) =>
          ce(View, { key: item.id, style: s.tableRow },
            ce(Text, { style: [s.cellText, s.colDescription] }, item.description),
            ce(Text, { style: [s.cellText, s.colQty] }, String(item.quantity)),
            ce(Text, { style: [s.cellText, s.colUnitPrice] }, fmt(item.unit_price)),
            ce(Text, { style: [s.cellText, s.colAmount] }, fmt(item.amount))
          )
        )
      ),
      ce(View, { style: s.totalsSection },
        ce(View, { style: s.totalRow },
          ce(Text, { style: s.totalLabel }, "Subtotal"),
          ce(Text, { style: s.totalValue }, fmt(subtotal))
        ),
        invoice.tax_rate > 0 ? ce(View, { style: s.totalRow },
          ce(Text, { style: s.totalLabel }, `Tax (${invoice.tax_rate}%)`),
          ce(Text, { style: s.totalValue }, fmt(taxAmount))
        ) : null,
        ce(View, { style: [s.totalRow, { marginTop: 4 }] },
          ce(Text, { style: s.grandTotalLabel }, "Total"),
          ce(Text, { style: s.grandTotalValue }, fmt(invoice.total_amount))
        )
      ),
      invoice.stripe_payment_link ? ce(View, { style: s.paymentLink },
        ce(Text, { style: s.paymentLinkLabel }, "Pay Online"),
        ce(Text, { style: s.paymentLinkUrl }, invoice.stripe_payment_link)
      ) : null,
      invoice.notes ? ce(View, { style: s.notes },
        ce(Text, { style: s.notesLabel }, "Notes"),
        ce(Text, { style: s.notesText }, invoice.notes)
      ) : null,
      ce(Text, { style: s.footer }, `Generated by ClientSpace · ${workspaceName}`)
    )
  );
}
