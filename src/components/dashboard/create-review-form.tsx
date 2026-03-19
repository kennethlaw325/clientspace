"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Link, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createReviewWithFile } from "@/lib/actions/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tab = "file" | "link";

export function CreateReviewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("file");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (tab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (tab === "link") {
        formData.append("link_url", linkUrl);
      }

      const result = await createReviewWithFile(projectId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      // 重置表單
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setSelectedFile(null);
      setOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Review Request
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">New Review Request</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tab switch */}
          <div className="flex gap-2 border-b border-border">
            <button
              type="button"
              onClick={() => setTab("file")}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === "file"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setTab("link")}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === "link"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link className="h-3.5 w-3.5" />
              Add Link
            </button>
          </div>

          {tab === "file" ? (
            <div>
              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  Click to upload image or PDF (max 50MB)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <Input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Review Request"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
