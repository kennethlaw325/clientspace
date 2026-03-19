import { getWorkspace } from "@/lib/actions/workspaces";
import { getSubscription } from "@/lib/actions/billing";
import { redirect } from "next/navigation";
import { BillingPanel } from "./billing-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing — ClientSpace" };

export default async function BillingPage() {
  const workspace = await getWorkspace();
  if (!workspace) redirect("/onboarding");

  const subscription = await getSubscription();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Billing & Plan</h1>
      <BillingPanel workspace={workspace} subscription={subscription} />
    </div>
  );
}
