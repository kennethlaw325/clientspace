import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PortalFileList } from "@/components/portal/portal-file-list";
import { PortalFileUpload } from "@/components/portal/portal-file-upload";
import type { Database } from "@/types/database";

export default async function PortalFilesPage({
  params,
}: {
  params: Promise<{ token: string; projectId: string }>;
}) {
  const { token, projectId } = await params;
  const supabase = createAdminClient();

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single() as { data: { id: string } | null };

  if (!client) notFound();

  // Verify project belongs to client
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("client_id", client.id)
    .single() as { data: { id: string; name: string } | null };

  if (!project) notFound();

  // Get files
  type FileRow = Database["public"]["Tables"]["files"]["Row"];
  const { data: filesData } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  const files = (filesData ?? []) as FileRow[];

  return (
    <div>
      <Link
        href={`/portal/${token}/${projectId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {project.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Files</h1>
        <PortalFileUpload token={token} projectId={projectId} />
      </div>

      <PortalFileList files={files} token={token} />
    </div>
  );
}
