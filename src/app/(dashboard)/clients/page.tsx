import { getClients } from "@/lib/actions/clients";
import { ClientCard } from "@/components/dashboard/client-card";
import { AddClientDialog } from "@/components/dashboard/add-client-dialog";
import { Users } from "lucide-react";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <AddClientDialog />
      </div>
      {clients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No clients yet. Add your first client to get started.</p>
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
