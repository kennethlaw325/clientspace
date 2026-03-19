"use client";

import { useActionState, useRef, useState } from "react";
import { updateWorkspace, uploadLogo } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workspace } from "@/types/database";

interface SettingsFormProps {
  workspace: Workspace;
}

export function SettingsForm({ workspace }: SettingsFormProps) {
  const [logoUrl, setLogoUrl] = useState(workspace.logo_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateWorkspace(formData);
      return result;
    },
    null
  );

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    const result = await uploadLogo(formData);
    setUploading(false);

    if (result.url) {
      setLogoUrl(result.url);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={workspace.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="brand_color"
                  name="brand_color"
                  defaultValue={workspace.brand_color}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <span className="text-sm text-slate-500">
                  Used in your client portal
                </span>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-green-600">Settings saved.</p>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Workspace logo"
              className="h-16 w-16 rounded-lg object-cover border"
            />
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portal URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-2">
            Your clients access their portal at this URL:
          </p>
          <code className="text-sm bg-slate-100 px-3 py-2 rounded block">
            {process.env.NEXT_PUBLIC_APP_URL}/portal/[client-token]
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
