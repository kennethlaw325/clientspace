import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Layers, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types/database";

type ProjectWithRelations = Project & {
  clients: { name: string; email: string } | null;
  deliverables: { count: number }[];
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  archived: "outline",
};

export function ProjectCard({ project }: { project: ProjectWithRelations }) {
  const deliverableCount = project.deliverables?.[0]?.count ?? 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant={statusVariant[project.status] ?? "secondary"}>
              {project.status}
            </Badge>
          </div>
          {project.clients && (
            <p className="text-sm text-muted-foreground">{project.clients.name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {deliverableCount} deliverable{deliverableCount !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              {project.used_revisions}/{project.max_revisions} revisions
            </div>
          </div>
          {project.due_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due {formatDate(project.due_date)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
