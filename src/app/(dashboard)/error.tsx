"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">出現了一些問題</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        載入頁面時發生錯誤，請重試。
      </p>
      <Button onClick={reset}>重試</Button>
    </div>
  );
}
