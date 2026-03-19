import { getWorkspace } from "@/lib/actions/workspaces";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/onboarding");

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      <SettingsForm workspace={workspace} />
    </div>
  );
}
