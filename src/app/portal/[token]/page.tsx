import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionCounter } from "@/components/dashboard/revision-counter";
import { PortalActivityTimeline } from "@/components/portal/portal-activity-timeline";
import { PortalProgressBar } from "@/components/portal/portal-progress-bar";
import type { Database } from "@/types/database";

export default async function PortalHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch client with workspace info
  type ClientWithWorkspace = Database["public"]["Tables"]["clients"]["Row"] & {
    workspaces: Database["public"]["Tables"]["workspaces"]["Row"] | null;
  };
  const { data: client } = await supabase
    .from("clients")
    .select("*, workspaces(*)")
    .eq("portal_token", token)
    .single() as { data: ClientWithWorkspace | null };

  if (!client) notFound();

  // Fetch projects with deliverable status breakdown for progress bars
  type ProjectWithAllDeliverables = Database["public"]["Tables"]["projects"]["Row"] & {
    deliverables: { status: string }[];
  };
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*, deliverables(status)")
    .eq("client_id", client.id)
    .eq("status", "active")
    .order("created_at", { ascending: false }) as { data: ProjectWithAllDeliverables[] | null };

  const projects = projectsData ?? [];

  // Fetch recent activity logs for this client
  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(10) as { data: Database["public"]["Tables"]["activity_logs"]["Row"][] | null };

  const workspace = client.workspaces;

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center gap-4">
        {workspace?.logo_url ? (
          <img
            src={workspace.logo_url}
            alt={workspace.name}
            className="h-12 w-12 rounded-lg object-cover border"
          />
        ) : (
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: workspace?.brand_color ?? "#6366f1" }}
          >
            {(workspace?.name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Welcome, {client.name}</h1>
          <p className="text-slate-500 text-sm">{workspace?.name} · Client Portal</p>
        </div>
      </div>

      {/* Projects with progress */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-slate-500 text-sm">No active projects yet.</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const deliverables = project.deliverables ?? [];
              const total = deliverables.length;
              const done = deliverables.filter((d) => d.status === "done").length;

              return (
                <Link key={project.id} href={`/portal/${token}/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge variant="secondary">{project.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {total > 0 && (
                        <PortalProgressBar
                          done={done}
                          total={total}
                          brandColor={workspace?.brand_color ?? "#6366f1"}
                        />
                      )}
                      <RevisionCounter used={project.used_revisions} max={project.max_revisions} />
                      {project.due_date && (
                        <p className="text-xs text-slate-400">
                          Due {new Date(project.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent activity timeline */}
      {activityLogs && activityLogs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Updates</h2>
          <PortalActivityTimeline
            activities={activityLogs}
            brandColor={workspace?.brand_color ?? "#6366f1"}
          />
        </section>
      )}
    </div>
  );
}
