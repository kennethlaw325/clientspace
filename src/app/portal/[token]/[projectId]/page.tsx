import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionCounter } from "@/components/dashboard/revision-counter";
import { FileText, MessageSquare } from "lucide-react";
import type { Database, Deliverable } from "@/types/database";

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const statusColors: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
};

export default async function PortalProjectPage({
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

  // Get project with deliverables
  type ProjectWithDeliverables = Database["public"]["Tables"]["projects"]["Row"] & {
    deliverables: Deliverable[];
  };
  const { data: project } = await supabase
    .from("projects")
    .select("*, deliverables(*)")
    .eq("id", projectId)
    .eq("client_id", client.id)
    .single() as { data: ProjectWithDeliverables | null };

  if (!project) notFound();

  const deliverables = project.deliverables ?? [];
  const columns = ["todo", "in_progress", "review", "done"] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <RevisionCounter used={project.used_revisions} max={project.max_revisions} />
      </div>

      <div className="flex gap-4 mb-6">
        <Link
          href={`/portal/${token}/${projectId}/files`}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <FileText className="h-4 w-4" />
          Files
        </Link>
        <Link
          href={`/portal/${token}/${projectId}/messages`}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
        >
          <MessageSquare className="h-4 w-4" />
          Messages
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">Deliverables</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((status) => {
          const items = deliverables.filter((d) => d.status === status);
          return (
            <div key={status} className="bg-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-slate-700">
                  {statusLabels[status]}
                </h3>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-md border p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium">{d.title}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                    )}
                    <Badge className={`mt-2 text-xs ${statusColors[d.status]}`} variant="secondary">
                      {statusLabels[d.status]}
                    </Badge>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No items
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
