import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PortalHeader } from "@/components/portal/portal-header";
import type { Database } from "@/types/database";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Validate token and get client + workspace
  type ClientWithWorkspace = Database["public"]["Tables"]["clients"]["Row"] & {
    workspaces: Database["public"]["Tables"]["workspaces"]["Row"] | null;
  };
  const { data: client } = await supabase
    .from("clients")
    .select("*, workspaces(*)")
    .eq("portal_token", token)
    .single() as { data: ClientWithWorkspace | null };

  if (!client) notFound();

  // Update last_seen_at
  await supabase
    .from("clients")
    .update({ last_seen_at: new Date().toISOString() } as Database["public"]["Tables"]["clients"]["Update"])
    .eq("id", client.id);

  const workspace = client.workspaces;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        workspaceName={workspace?.name ?? ""}
        brandColor={workspace?.brand_color ?? "#6366f1"}
        logoUrl={workspace?.logo_url ?? null}
      />
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
