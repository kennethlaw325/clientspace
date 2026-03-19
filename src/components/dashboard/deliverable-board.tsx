"use client";

import { useRouter } from "next/navigation";
import { DeliverableColumn } from "./deliverable-column";
import { updateDeliverableStatus } from "@/lib/actions/deliverables";
import type { Deliverable } from "@/types/database";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
] as const;

export function DeliverableBoard({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: Deliverable[];
}) {
  const router = useRouter();

  async function handleStatusChange(deliverableId: string, newStatus: string) {
    await updateDeliverableStatus(deliverableId, newStatus);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <DeliverableColumn
          key={column.id}
          title={column.label}
          status={column.id}
          projectId={projectId}
          deliverables={deliverables.filter((d) => d.status === column.id)}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
