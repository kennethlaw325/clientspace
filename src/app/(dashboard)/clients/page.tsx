import { getClients } from "@/lib/actions/clients";
import { ClientCard } from "@/components/dashboard/client-card";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";
import { Users, Archive } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
            className={cn(buttonVariants({ variant: showArchived ? "secondary" : "ghost", size: "sm" }))}
          >
            <Archive className="h-4 w-4 mr-1.5" />
            {showArchived ? "顯示使用中" : "顯示已封存"}
          </Link>
          {!showArchived && <AddClientDialog />}
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>
            {showArchived
              ? "沒有已封存的客戶。"
              : "尚無客戶。新增第一位客戶開始使用。"}
          </p>
        </div>
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
