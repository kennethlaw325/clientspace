import { getProjectFiles } from "@/lib/actions/files";
import { FileUpload } from "@/components/dashboard/file-upload";
import { FileList } from "@/components/dashboard/file-list";

export default async function ProjectFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const files = await getProjectFiles(id);

  return (
    <div className="space-y-6">
      <FileUpload projectId={id} />
      <FileList files={files} />
    </div>
  );
}
