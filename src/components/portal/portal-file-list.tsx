"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import { portalGetFileUrl } from "@/lib/actions/portal";
import type { FileRecord } from "@/types/database";

export function PortalFileList({
  files,
  token,
}: {
  files: FileRecord[];
  token: string;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDownload(storagePath: string, fileId: string) {
    setLoadingId(fileId);
    const url = await portalGetFileUrl(token, storagePath);
    setLoadingId(null);
    if (url) window.open(url, "_blank");
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Name</span>
        <span>Size</span>
        <span>Version</span>
        <span>Uploaded</span>
        <span>Download</span>
      </div>
      {files.map((file) => (
        <div
          key={file.id}
          className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{file.file_name}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {file.uploaded_by_type}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatFileSize(file.file_size)}
          </span>
          <Badge variant="outline" className="text-xs">
            v{file.version}
          </Badge>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(file.created_at)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDownload(file.storage_path, file.id)}
            disabled={loadingId === file.id}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
