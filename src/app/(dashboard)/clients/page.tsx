import { getClients } from "@/lib/actions/clients";
import { ClientCard } from "@/components/dashboard/client-card";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";
import { Users, Archive } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  const clients = await getClients(showArchived);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">客戶</h1>
        <div className="flex items-center gap-2">
          <Link
            href={showArchived ? "/clients" : "/clients?archived=1"}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all h-7 gap-1 px-2.5",
              showArchived
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "hover:bg-muted hover:text-foreground"
            )}
          >
            <Archive className="h-4 w-4 mr-1.5" />
            {showArchived ? "顯示使用中" : "顯示已封存"}
          </Link>
          {!showArchived && <AddClientDialog />}
        </div>
      </div>

      {clients.length === 0 ? (
        showArchived ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm">沒有已封存的客戶。</p>
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">尚無客戶</h3>
            <p className="text-sm text-muted-foreground mb-6">
              新增第一位客戶，開始管理你的工作關係。
            </p>
            <AddClientDialog />
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
