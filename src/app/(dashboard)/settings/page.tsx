import { getWorkspace } from "@/lib/actions/workspaces";
import { getNotificationPreferences } from "@/lib/actions/notifications";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { NotificationPreferences } from "./notification-preferences";

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/onboarding");

  const preferences = await getNotificationPreferences();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      <div className="space-y-6">
        <SettingsForm workspace={workspace} />
        <NotificationPreferences preferences={preferences} />
      </div>
    </div>
  );
}
