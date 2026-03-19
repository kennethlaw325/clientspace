import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, MessageSquare, Layers, RefreshCw, CheckSquare } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const deliverables = project.deliverables ?? [];
  const statusCounts = {
    todo: deliverables.filter((d) => d.status === "todo").length,
    in_progress: deliverables.filter((d) => d.status === "in_progress").length,
    review: deliverables.filter((d) => d.status === "review").length,
    done: deliverables.filter((d) => d.status === "done").length,
  };

  return (
    <div>
      {/* Back link + header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Client: {project.clients?.name}
            </p>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              {project.used_revisions}/{project.max_revisions} revisions
            </div>
            <Badge>{project.status}</Badge>
          </div>
        </div>
        {project.due_date && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            Due {formatDate(project.due_date)}
          </div>
        )}
      </div>

      {/* Tab-style navigation */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          <span className="inline-flex items-center gap-1.5 border-b-2 border-foreground px-1 pb-3 text-sm font-medium">
            <Layers className="h-4 w-4" />
            Deliverables
          </span>
          <Link
            href={`/projects/${id}/files`}
            className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Files
          </Link>
          <Link
            href={`/projects/${id}/messages`}
            className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>
          <Link
            href={`/projects/${id}/reviews`}
            className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            Reviews
          </Link>
        </nav>
      </div>

      {/* Deliverables overview */}
      {deliverables.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No deliverables yet. They will appear here once Task 10 is implemented.</p>
        </div>
      ) : (
        <div>
          {/* Status summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border border-border bg-white p-4 text-center">
              <p className="text-2xl font-bold">{statusCounts.todo}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{statusCounts.review}</p>
              <p className="text-xs text-muted-foreground">Review</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{statusCounts.done}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>

          {/* Deliverable list */}
          <div className="space-y-2">
            {deliverables.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  {d.description && (
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                  )}
                </div>
                <Badge
                  variant={d.status === "done" ? "default" : "secondary"}
                >
                  {d.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
