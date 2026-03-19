"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTimeEntry, updateTimeEntry } from "@/lib/actions/time-entries";
import type { TimeEntry } from "@/types/database";

interface TimeEntryFormProps {
  projectId: string;
  entry?: TimeEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TimeEntryForm({ projectId, entry, onSuccess, onCancel }: TimeEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("project_id", projectId);

    startTransition(async () => {
      const result = entry
        ? await updateTimeEntry(entry.id, formData)
        : await createTimeEntry(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            name="description"
            placeholder="工作內容描述"
            defaultValue={entry?.description}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">時長（分鐘）</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min="1"
            placeholder="60"
            defaultValue={entry?.duration_minutes}
            required
          />
        </div>
        <div>
          <Label htmlFor="hourly_rate">時薪 ($)</Label>
          <Input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            defaultValue={entry?.hourly_rate ?? 0}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="date">日期</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={entry?.date ?? today}
            required
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "儲存中..." : entry ? "更新" : "新增"}
        </Button>
      </div>
    </form>
  );
}
