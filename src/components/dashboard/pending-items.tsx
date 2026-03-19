import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import type { PendingItem } from "@/lib/actions/dashboard";

function PendingItemRow({ item }: { item: PendingItem }) {
  const Icon = item.type === "overdue_invoice" ? AlertCircle : Clock;
  const iconColor = item.type === "overdue_invoice" ? "text-red-500" : "text-amber-500";

  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors"
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
      </div>
    </Link>
  );
}

export function PendingItems({ items }: { items: PendingItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <p>沒有待處理事項</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((item) => (
        <PendingItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
