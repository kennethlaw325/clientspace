import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    stripe: "ok" | "error" | "not_configured";
    stripe_mode?: "live" | "test" | "unknown";
    resend: "ok" | "error" | "not_configured";
  };
}

export async function GET() {
  const checks: HealthStatus["checks"] = {
    database: "error",
    stripe: "not_configured",
    resend: "not_configured",
  };

  // 檢查 Supabase 連接
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("workspaces").select("id").limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  // 檢查 Stripe 設定
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { getStripe, getStripeMode } = await import("@/lib/stripe");
      await getStripe().balance.retrieve();
      checks.stripe = "ok";
      checks.stripe_mode = getStripeMode();
    } catch {
      checks.stripe = "error";
    }
  }

  // 檢查 Resend 設定
  if (process.env.RESEND_API_KEY) {
    checks.resend = "ok";
  }

  const allCriticalOk = checks.database === "ok";
  const anyError = Object.values(checks).includes("error");

  const overallStatus: HealthStatus["status"] = !allCriticalOk
    ? "error"
    : anyError
    ? "degraded"
    : "ok";

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
    checks,
  };

  const httpStatus = overallStatus === "error" ? 503 : 200;

  return NextResponse.json(body, { status: httpStatus });
}
