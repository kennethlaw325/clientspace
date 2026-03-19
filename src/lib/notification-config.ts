import type { NotificationEventType } from "@/lib/notifications";

export const ALL_EVENT_TYPES: {
  type: NotificationEventType;
  label: string;
  description: string;
}[] = [
  {
    type: "invoice_sent",
    label: "Invoice Sent",
    description: "When you send an invoice to a client",
  },
  {
    type: "payment_received",
    label: "Payment Received",
    description: "When a client pays an invoice",
  },
  {
    type: "review_requested",
    label: "Review Requested",
    description: "When a deliverable is sent for client review",
  },
  {
    type: "deliverable_approved",
    label: "Deliverable Approved",
    description: "When a client approves your deliverable",
  },
  {
    type: "revision_requested",
    label: "Revision Requested",
    description: "When a client requests revisions on a deliverable",
  },
  {
    type: "welcome",
    label: "Welcome Email",
    description: "Onboarding email when you create your account",
  },
];
