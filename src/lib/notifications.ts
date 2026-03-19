"use server";

import { Resend } from "resend";
import { render } from "@react-email/components";
import { InvoiceSentEmail } from "@/components/emails/invoice-sent";
import { PaymentReceivedEmail } from "@/components/emails/payment-received";
import { ReviewRequestedEmail } from "@/components/emails/review-requested";
import { DeliverableApprovedEmail } from "@/components/emails/deliverable-approved";
import { RevisionRequestedEmail } from "@/components/emails/revision-requested";
import { WelcomeEmail } from "@/components/emails/welcome";
import { createAdminClient } from "@/lib/supabase/admin";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

export type NotificationEventType =
  | "invoice_sent"
  | "payment_received"
  | "review_requested"
  | "deliverable_approved"
  | "revision_requested"
  | "welcome";

// ─── 通知偏好查詢 ──────────────────────────────────────────────────────────────

async function isNotificationEnabled(
  userId: string,
  eventType: NotificationEventType
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .single();

    // 如果沒有設定，預設開啟
    if (!data) return true;
    return data.email_enabled;
  } catch {
    return true;
  }
}

// ─── 各類型通知 ──────────────────────────────────────────────────────────────

interface InvoiceSentParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  invoiceNumber: string;
  amount: string;
  projectName?: string;
  paymentLink?: string;
  dueDate?: string;
}

export async function sendInvoiceSentEmail(params: InvoiceSentParams) {
  const html = await render(
    InvoiceSentEmail({ ...params })
  );
  await getResend().emails.send({
    from: `${params.workspaceName} via ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.workspaceName}`,
    html,
  });
}

interface PaymentReceivedParams {
  userId: string;
  to: string;
  recipientName: string;
  workspaceName: string;
  invoiceNumber: string;
  amount: string;
  projectName?: string;
  clientName?: string;
}

export async function sendPaymentReceivedEmail(params: PaymentReceivedParams) {
  if (!(await isNotificationEnabled(params.userId, "payment_received"))) return;
  const html = await render(
    PaymentReceivedEmail({ ...params })
  );
  await getResend().emails.send({
    from: `ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: `Payment received: ${params.amount} for invoice ${params.invoiceNumber}`,
    html,
  });
}

interface ReviewRequestedParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  reviewUrl: string;
  description?: string;
}

export async function sendReviewRequestedEmail(params: ReviewRequestedParams) {
  const html = await render(
    ReviewRequestedEmail({ ...params })
  );
  await getResend().emails.send({
    from: `${params.workspaceName} via ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: `Review requested: ${params.reviewTitle} — ${params.projectName}`,
    html,
  });
}

interface DeliverableApprovedParams {
  userId: string;
  to: string;
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  clientName: string;
  reviewUrl: string;
}

export async function sendDeliverableApprovedEmail(params: DeliverableApprovedParams) {
  if (!(await isNotificationEnabled(params.userId, "deliverable_approved"))) return;
  const html = await render(
    DeliverableApprovedEmail({ ...params })
  );
  await getResend().emails.send({
    from: `ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: `✅ "${params.reviewTitle}" approved by ${params.clientName}`,
    html,
  });
}

interface RevisionRequestedParams {
  userId: string;
  to: string;
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  clientName: string;
  reviewUrl: string;
  clientComment?: string;
}

export async function sendRevisionRequestedEmail(params: RevisionRequestedParams) {
  if (!(await isNotificationEnabled(params.userId, "revision_requested"))) return;
  const html = await render(
    RevisionRequestedEmail({ ...params })
  );
  await getResend().emails.send({
    from: `ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: `🔄 "${params.reviewTitle}" revision requested by ${params.clientName}`,
    html,
  });
}

interface WelcomeParams {
  to: string;
  recipientName?: string;
  appUrl: string;
}

export async function sendWelcomeEmail(params: WelcomeParams) {
  const html = await render(
    WelcomeEmail({ recipientName: params.recipientName, appUrl: params.appUrl })
  );
  await getResend().emails.send({
    from: `ClientSpace <noreply@clientspace.io>`,
    to: params.to,
    subject: "Welcome to ClientSpace",
    html,
  });
}
