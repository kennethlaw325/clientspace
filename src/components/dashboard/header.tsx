import { signOut } from "@/lib/actions/auth";
import { getWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";

export async function Header() {
  const workspace = await getWorkspace();

  return (
    <header className="h-14 border-b bg-white px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h2 className="text-sm font-medium text-slate-600">
          {workspace?.name}
        </h2>
      </div>
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </form>
    </header>
  );
}
