"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTimeEntry } from "@/lib/actions/time-entries";
import { TimeEntryForm } from "./time-entry-form";
import type { TimeEntry } from "@/types/database";

interface TimeEntryListProps {
  entries: TimeEntry[];
  projectId: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TimeEntryList({ entries, projectId }: TimeEntryListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("確定刪除此時間記錄？")) return;
    startTransition(async () => {
      await deleteTimeEntry(id, projectId);
    });
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        尚未有時間記錄
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-border bg-white p-4">
          {editingId === entry.id ? (
            <TimeEntryForm
              projectId={projectId}
              entry={entry}
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.description}</p>
                <p className="text-sm text-muted-foreground">{entry.date}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <Badge variant="secondary">{formatDuration(entry.duration_minutes)}</Badge>
                  {entry.hourly_rate > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${((entry.duration_minutes / 60) * entry.hourly_rate).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditingId(entry.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(entry.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
