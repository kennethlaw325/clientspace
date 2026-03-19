"use client";

import { useState } from "react";
import { Check, Zap, Crown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Workspace, Subscription } from "@/types/database";
import { PLANS } from "@/lib/plans";

interface Props {
  workspace: Workspace;
  subscription: Subscription | null;
}

const PLAN_META = {
  free: { icon: null, color: "slate", label: "Free" },
  starter: { icon: Zap, color: "indigo", label: "Starter" },
  pro: { icon: Crown, color: "violet", label: "Pro" },
} as const;

export function BillingPanel({ workspace, subscription }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const currentPlan = subscription?.plan ?? workspace.plan ?? "free";

  async function handleUpgrade(plan: "starter" | "pro") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  }

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const isPastDue = subscription?.status === "past_due";

  return (
    <div className="space-y-6">
      {/* Current plan status */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Current Plan</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {PLAN_META[currentPlan].label}
              </h2>
              {isPastDue && (
                <span className="rounded-full bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5">
                  Payment Past Due
                </span>
              )}
              {subscription?.cancel_at_period_end && (
                <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5">
                  Cancels at period end
                </span>
              )}
            </div>
            {subscription?.current_period_end && isActive && (
              <p className="text-sm text-slate-500 mt-1">
                {subscription.cancel_at_period_end ? "Access until" : "Renews"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          {currentPlan !== "free" && (
            <button
              onClick={handleManageBilling}
              disabled={loading === "portal"}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {loading === "portal" ? "Loading…" : "Manage billing"}
            </button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(["starter", "pro"] as const).map((planKey) => {
          const plan = PLANS[planKey];
          const meta = PLAN_META[planKey];
          const Icon = meta.icon;
          const isCurrent = currentPlan === planKey;

          return (
            <div
              key={planKey}
              className={`rounded-xl border p-6 flex flex-col ${
                isCurrent
                  ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon className="h-5 w-5 text-indigo-500" />}
                <span className="font-semibold text-slate-900">{plan.name}</span>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5">
                    Current
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loading === "portal"}
                  className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {loading === "portal" ? "Loading…" : "Manage subscription"}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={loading === planKey}
                  className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {loading === planKey ? "Loading…" : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
