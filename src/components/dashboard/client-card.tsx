import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Building } from "lucide-react";
import type { Client } from "@/types/database";

export function ClientCard({ client }: { client: Client & { projects: { count: number }[] } }) {
  const projectCount = client.projects?.[0]?.count ?? 0;
  const isArchived = !!client.archived_at;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isArchived ? "opacity-60" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg truncate">{client.name}</CardTitle>
            {isArchived && (
              <Badge variant="outline" className="text-xs shrink-0">已封存</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            {client.email}
          </div>
          {client.company && (
            <div className="flex items-center gap-2">
              <Building className="h-3.5 w-3.5" />
              {client.company}
            </div>
          )}
          <Badge variant="secondary">{projectCount} 個專案</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
