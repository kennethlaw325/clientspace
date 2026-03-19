"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatFileSize } from "@/lib/utils";
import { getFileUrl, deleteFile } from "@/lib/actions/files";
import type { FileRecord } from "@/types/database";

export function FileList({ files }: { files: FileRecord[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDownload(storagePath: string) {
    const url = await getFileUrl(storagePath);
    if (url) window.open(url, "_blank");
  }

  async function handleDelete(id: string, storagePath: string) {
    setLoadingId(id);
    try {
      await deleteFile(id, storagePath);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
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
      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
        <span>Name</span>
        <span>Size</span>
        <span>Version</span>
        <span>Uploaded</span>
        <span>Actions</span>
      </div>
      {files.map((file) => (
        <div key={file.id} className="border-b border-border last:border-b-0">
          {/* Desktop row */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3">
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
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDownload(file.storage_path)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={() => handleDelete(file.id, file.storage_path)}
                disabled={loadingId === file.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Mobile card */}
          <div className="md:hidden px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">{file.file_name}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {file.uploaded_by_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                v{file.version}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(file.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => handleDownload(file.storage_path)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-red-600 hover:text-red-700"
                onClick={() => handleDelete(file.id, file.storage_path)}
                disabled={loadingId === file.id}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
