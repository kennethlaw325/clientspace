import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            <div>
              <Skeleton className="h-4 w-28 mb-1.5" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1.5" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
