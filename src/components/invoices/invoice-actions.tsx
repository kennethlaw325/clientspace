"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Download, Edit, Trash2, CheckCircle, ExternalLink, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendInvoice, deleteInvoice, markInvoicePaid, sendPaymentReminder } from "@/lib/actions/invoices";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
  invoiceNumber: string;
  stripePaymentLink: string | null;
}

export function InvoiceActions({
  invoiceId,
  status,
  invoiceNumber,
  stripePaymentLink,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      const result = await sendInvoice(invoiceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice sent to client");
        router.refresh();
      }
    });
  }

  function handleMarkPaid() {
    startTransition(async () => {
      const result = await markInvoicePaid(invoiceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice marked as paid");
        router.refresh();
      }
    });
  }

  function handleSendReminder() {
    startTransition(async () => {
      const result = await sendPaymentReminder(invoiceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Payment reminder sent to client");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice deleted");
        router.push("/invoices");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/api/invoices/${invoiceId}/pdf`} download>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" />
          Download PDF
        </Button>
      </a>

      {(status === "draft" || status === "sent") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/invoices/${invoiceId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      )}

      {(status === "draft" || status === "sent") && (
        <Button size="sm" onClick={handleSend} disabled={isPending}>
          <Send className="h-4 w-4 mr-1.5" />
          {status === "sent" ? "Resend" : "Send to Client"}
        </Button>
      )}

      {(status === "sent" || status === "overdue") && (
        <Button
          variant="outline"
          size="sm"
          className="text-green-700 border-green-300 hover:bg-green-50"
          onClick={handleMarkPaid}
          disabled={isPending}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Mark as Paid
        </Button>
      )}

      {(status === "sent" || status === "overdue") && (
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
          onClick={handleSendReminder}
          disabled={isPending}
        >
          <Bell className="h-4 w-4 mr-1.5" />
          Send Reminder
        </Button>
      )}

      {stripePaymentLink && (
        <a href={stripePaymentLink} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Payment Link
          </Button>
        </a>
      )}

      {(status === "draft" || status === "cancelled") && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      )}
    </div>
  );
}
