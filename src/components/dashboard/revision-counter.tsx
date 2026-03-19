import { cn } from "@/lib/utils";

export function RevisionCounter({ used, max }: { used: number; max: number }) {
  const isOverLimit = used >= max;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-6 rounded-sm",
              i < used
                ? isOverLimit ? "bg-red-500" : "bg-indigo-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <span className={cn(
        "font-medium",
        isOverLimit ? "text-red-600" : "text-muted-foreground"
      )}>
        {used}/{max} revisions
      </span>
    </div>
  );
}
