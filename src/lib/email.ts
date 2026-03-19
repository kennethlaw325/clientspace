"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  await resend.emails.send({
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
