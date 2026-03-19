import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient, archiveClient, unarchiveClient } from "@/lib/actions/clients";
import { getClientActivity } from "@/lib/actions/activity";
import { getClientFiles } from "@/lib/actions/files";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Archive, ArchiveRestore, Mail, Building, FolderOpen, FileIcon } from "lucide-react";
import { revalidatePath } from "next/cache";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [client, activityLogs, clientFiles] = await Promise.all([
    getClient(id),
    getClientActivity(id, 30),
    getClientFiles(id),
  ]);

  if (!client) notFound();

  const isArchived = !!client.archived_at;

  async function handleArchive() {
    "use server";
    if (isArchived) {
      await unarchiveClient(id);
    } else {
      await archiveClient(id);
    }
    revalidatePath(`/clients/${id}`);
    revalidatePath("/clients");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {isArchived && (
              <Badge variant="secondary" className="text-xs">已封存</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {client.email}
            </span>
            {client.company && (
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" />
                {client.company}
              </span>
            )}
          </div>
        </div>
        <form action={handleArchive}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className={isArchived ? "text-blue-600 hover:text-blue-700" : "text-yellow-600 hover:text-yellow-700"}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-1.5" />
                取消封存
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-1.5" />
                封存客戶
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">概覽</TabsTrigger>
          <TabsTrigger value="projects">
            專案
            {client.projects && client.projects.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {client.projects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="files">
            檔案
            {clientFiles.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {clientFiles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">活動記錄</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{client.projects?.length ?? 0}</div>
                <p className="text-sm text-muted-foreground mt-1">個專案</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{clientFiles.length}</div>
                <p className="text-sm text-muted-foreground mt-1">個檔案</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {client.projects?.filter((p) => p.status === "active").length ?? 0}
                </div>
                <p className="text-sm text-muted-foreground mt-1">個進行中專案</p>
              </CardContent>
            </Card>
          </div>
          {/* Recent activity preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近活動</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed logs={activityLogs.slice(0, 5)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          {!client.projects || client.projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>尚無專案</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {client.projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        variant={project.status === "active" ? "default" : "secondary"}
                      >
                        {project.status === "active" ? "進行中" : project.status === "completed" ? "已完成" : "已封存"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          {clientFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>尚無檔案</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clientFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.projects?.name ?? ""} · {formatFileSize(file.file_size)}
                        {file.version > 1 && ` · v${file.version}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <ActivityFeed logs={activityLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
