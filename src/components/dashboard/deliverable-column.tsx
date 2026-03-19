"use client";

import { useRouter } from "next/navigation";
import { createDeliverable } from "@/lib/actions/deliverables";
import { DeliverableItem } from "./deliverable-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Deliverable } from "@/types/database";

export function DeliverableColumn({
  title,
  status,
  projectId,
  deliverables,
  onStatusChange,
}: {
  title: string;
  status: string;
  projectId: string;
  deliverables: Deliverable[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    await createDeliverable(projectId, formData);
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="bg-slate-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
        <span className="text-xs text-muted-foreground">{deliverables.length}</span>
      </div>
      <div className="space-y-2">
        {deliverables.map((d) => (
          <DeliverableItem key={d.id} deliverable={d} onStatusChange={onStatusChange} />
        ))}
        {status === "todo" && (
          adding ? (
            <form action={handleAdd} className="space-y-2">
              <Input name="title" placeholder="Deliverable title" autoFocus required />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Add</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          )
        )}
      </div>
    </div>
  );
}
