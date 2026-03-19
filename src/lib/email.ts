"use server";

import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

type EmailType = "new_message" | "new_file" | "status_update";

interface NotificationParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  projectName: string;
  type: EmailType;
  detail: string;
  portalUrl?: string;
}

export async function sendNotification({
  to,
  recipientName,
  workspaceName,
  projectName,
  type,
  detail,
  portalUrl,
}: NotificationParams) {
  const subjects: Record<EmailType, string> = {
    new_message: `New message on ${projectName}`,
    new_file: `New file uploaded to ${projectName}`,
    status_update: `${projectName} status updated`,
  };

  const ctaUrl = portalUrl ?? process.env.NEXT_PUBLIC_APP_URL;

  await getResend().emails.send({
    from: `${workspaceName} via ClientSpace <noreply@clientspace.io>`,
    to,
    subject: subjects[type],
    html: `
      <h2>Hi ${recipientName},</h2>
      <p>${detail}</p>
      <p><a href="${ctaUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Project</a></p>
    `,
  });
}

// ─────────────────────────────────────────────
// Review 審核通知（通知 Freelancer 客戶已審核）
// ─────────────────────────────────────────────

interface ReviewNotificationParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  projectName: string;
  reviewTitle: string;
  status: "approved" | "revision_requested";
  clientName: string;
  reviewUrl: string;
}

export async function sendReviewNotification({
  to,
  recipientName,
  workspaceName,
  projectName,
  reviewTitle,
  status,
  clientName,
  reviewUrl,
}: ReviewNotificationParams) {
  const isApproved = status === "approved";
  const subject = isApproved
    ? `✅ "${reviewTitle}" approved by ${clientName}`
    : `🔄 "${reviewTitle}" revision requested by ${clientName}`;

  const actionText = isApproved
    ? `<strong>${clientName}</strong> has approved your deliverable.`
    : `<strong>${clientName}</strong> has requested revisions on your deliverable.`;

  await getResend().emails.send({
    from: `${workspaceName} via ClientSpace <noreply@clientspace.io>`,
    to,
    subject,
    html: `
      <h2>Hi ${recipientName},</h2>
      <p>Project: <strong>${projectName}</strong></p>
      <p>Deliverable: <strong>${reviewTitle}</strong></p>
      <p>${actionText}</p>
      <p>
        <a href="${reviewUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          View Review
        </a>
      </p>
    `,
  });
}
