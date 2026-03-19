"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { portalUploadFile } from "@/lib/actions/portal";
import { Upload } from "lucide-react";

export function PortalFileUpload({
  token,
  projectId,
}: {
  token: string;
  projectId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await portalUploadFile(token, projectId, formData);
    setUploading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
