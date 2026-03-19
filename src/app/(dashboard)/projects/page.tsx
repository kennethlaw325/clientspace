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
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No projects yet. Create your first project to get started.</p>
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
