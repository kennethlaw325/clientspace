export function PortalProgressBar({
  done,
  total,
  brandColor,
}: {
  done: number;
  total: number;
  brandColor: string;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Progress</span>
        <span>{done}/{total} tasks done ({pct}%)</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: brandColor }}
        />
      </div>
    </div>
  );
}
