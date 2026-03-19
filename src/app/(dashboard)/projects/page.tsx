import { getProjects } from "@/lib/actions/projects";
import { getClients } from "@/lib/actions/clients";
import { ProjectCard } from "@/components/dashboard/project-card";
import { AddProjectDialog } from "@/components/dashboard/add-project-dialog";
import { FolderOpen } from "lucide-react";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <AddProjectDialog clients={clientOptions} />
      </div>
      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first project to start collaborating with clients.
          </p>
          <AddProjectDialog clients={clientOptions} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
