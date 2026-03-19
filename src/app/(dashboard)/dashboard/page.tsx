export const dynamic = "force-dynamic";

import Link from "next/link";
import { DollarSign, Clock, FolderOpen, Users, AlertTriangle } from "lucide-react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PendingItems } from "@/components/dashboard/pending-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const { stats, recentActivity, pendingItems } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Welcome back — here&apos;s your business snapshot.</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="本月收入"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          description="已付發票合計"
          iconColor="text-green-600"
        />
        <StatsCard
          title="待收款項"
          value={formatCurrency(stats.pendingReceivables)}
          icon={Clock}
          description="已發送未付"
          iconColor="text-amber-600"
        />
        <StatsCard
          title="活躍專案"
          value={String(stats.activeProjects)}
          icon={FolderOpen}
          description="進行中"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="活躍客戶"
          value={String(stats.activeClients)}
          icon={Users}
          description="未封存"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 最近活動 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">最近活動</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ActivityFeed logs={recentActivity} />
          </CardContent>
        </Card>

        {/* 待處理 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">待處理</CardTitle>
                {pendingItems.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-red-100 text-red-600 rounded-full">
                    {pendingItems.length}
                  </span>
                )}
              </div>
              {pendingItems.length > 0 && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <PendingItems items={pendingItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
