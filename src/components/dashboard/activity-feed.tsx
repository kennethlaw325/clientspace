import {
  UserPlus,
  Archive,
  ArchiveRestore,
  FolderPlus,
  RefreshCw,
  Upload,
  MessageSquare,
  Activity,
} from "lucide-react";
import type { ActivityLog } from "@/types/database";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 個月前`;
}

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  client_created: { label: "新增客戶", icon: UserPlus, color: "text-green-500" },
  client_archived: { label: "封存客戶", icon: Archive, color: "text-yellow-500" },
  client_unarchived: { label: "取消封存客戶", icon: ArchiveRestore, color: "text-blue-500" },
  project_created: { label: "新增專案", icon: FolderPlus, color: "text-purple-500" },
  project_status_changed: { label: "更新專案狀態", icon: RefreshCw, color: "text-orange-500" },
  file_uploaded: { label: "上傳檔案", icon: Upload, color: "text-sky-500" },
  message_sent: { label: "發送訊息", icon: MessageSquare, color: "text-indigo-500" },
  deliverable_status_changed: { label: "更新交付物狀態", icon: RefreshCw, color: "text-pink-500" },
};

function getEventDetail(log: ActivityLog): string {
  const meta = log.metadata as Record<string, unknown> | null;
  switch (log.event_type) {
    case "client_created":
      return meta?.name ? `${meta.name}` : "";
    case "client_archived":
    case "client_unarchived":
      return meta?.name ? `${meta.name}` : "";
    case "project_created":
      return meta?.name ? `${meta.name}` : "";
    case "project_status_changed":
      return meta?.name ? `${meta.name} → ${meta.status}` : "";
    case "file_uploaded":
      return meta?.file_name ? `${meta.file_name}` : "";
    default:
      return "";
  }
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const config = EVENT_CONFIG[log.event_type] ?? {
    label: log.event_type,
    icon: Activity,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const detail = getEventDetail(log);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 shrink-0 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{config.label}</span>
          {detail && <span className="text-muted-foreground"> — {detail}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {timeAgo(log.created_at)}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>尚無活動記錄</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {logs.map((log) => (
        <ActivityItem key={log.id} log={log} />
      ))}
    </div>
  );
}
