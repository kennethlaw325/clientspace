import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionCounter } from "@/components/dashboard/revision-counter";
import type { Database } from "@/types/database";

export default async function PortalHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single() as { data: { id: string } | null };

  if (!client) notFound();

  type ProjectWithDeliverableCount = Database["public"]["Tables"]["projects"]["Row"] & {
    deliverables: { count: number }[];
  };
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*, deliverables(count)")
    .eq("client_id", client.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const projects = (projectsData ?? []) as ProjectWithDeliverableCount[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
      <div className="grid gap-4">
        {projects?.map((project) => (
          <Link key={project.id} href={`/portal/${token}/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{project.name}</CardTitle>
                  <Badge>{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RevisionCounter used={project.used_revisions} max={project.max_revisions} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
