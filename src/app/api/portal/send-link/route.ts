import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await request.json();

  const { data: client } = await supabase
    .from("clients")
    .select("name, email, portal_token")
    .eq("id", clientId)
    .single() as { data: { name: string; email: string; portal_token: string } | null };

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("owner_id", user.id)
    .single() as { data: { name: string } | null };

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_token}`;

  await resend.emails.send({
    from: "ClientSpace <noreply@clientspace.io>",
    to: client.email,
    subject: `${workspace?.name} has shared a project portal with you`,
    html: `
      <h2>Hi ${client.name},</h2>
      <p>${workspace?.name} has invited you to their client portal.</p>
      <p><a href="${portalUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Portal</a></p>
      <p style="color:#666;font-size:14px;">This link is private to you. Do not share it.</p>
    `,
  });

  return NextResponse.json({ success: true });
}
