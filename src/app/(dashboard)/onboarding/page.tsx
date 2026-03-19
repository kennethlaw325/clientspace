"use client";

import { useState } from "react";
import { createWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createWorkspace(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your workspace</CardTitle>
          <CardDescription>
            This is what your clients will see. You can change it later.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input id="name" name="name" placeholder="e.g. Jane Design Studio" required />
              <p className="text-xs text-muted-foreground">
                This creates your portal URL: app.clientspace.io/jane-design-studio
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
