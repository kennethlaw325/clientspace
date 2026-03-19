"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Deliverable } from "@/types/database";

const statuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export function DeliverableItem({
  deliverable,
  onStatusChange,
}: {
  deliverable: Deliverable;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <Card className="bg-white">
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium">{deliverable.title}</p>
        {deliverable.description && (
          <p className="text-xs text-muted-foreground">{deliverable.description}</p>
        )}
        <Select
          value={deliverable.status}
          onValueChange={(value) => value && onStatusChange(deliverable.id, value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
