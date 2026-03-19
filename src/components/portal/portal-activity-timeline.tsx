import type { Database } from "@/types/database";

type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

const eventLabels: Record<string, string> = {
  project_created: "Project created",
  project_updated: "Project updated",
  deliverable_created: "Task added",
  deliverable_updated: "Task updated",
  deliverable_status_changed: "Task status changed",
  file_uploaded: "File uploaded",
  message_sent: "Message sent",
  invoice_created: "Invoice created",
  invoice_paid: "Invoice paid",
  revision_requested: "Revision requested",
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getEventLabel(log: ActivityLog): string {
  const base = eventLabels[log.event_type] ?? log.event_type.replace(/_/g, " ");
  const meta = log.metadata as Record<string, string> | null;
  if (meta?.title) return `${base}: ${meta.title}`;
  if (meta?.name) return `${base}: ${meta.name}`;
  return base;
}

export function PortalActivityTimeline({
  activities,
  brandColor,
}: {
  activities: ActivityLog[];
  brandColor: string;
}) {
  return (
    <div className="relative space-y-0">
      {activities.map((log, i) => (
        <div key={log.id} className="flex gap-4">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ring-2 ring-white"
              style={{ backgroundColor: brandColor }}
            />
            {i < activities.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="pb-5 min-w-0">
            <p className="text-sm text-slate-700 font-medium leading-5">
              {getEventLabel(log)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatTimeAgo(log.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
