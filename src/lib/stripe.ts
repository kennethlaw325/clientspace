import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // 生產環境安全檢查：防止誤用 test mode keys
    if (process.env.NODE_ENV === "production" && secretKey.startsWith("sk_test_")) {
      console.warn(
        "[Stripe] WARNING: Using test mode secret key in production environment. " +
        "Please switch to live mode keys (sk_live_...) before going live."
      );
    }

    _stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

/** 回傳目前 Stripe key 模式（live / test / unknown） */
export function getStripeMode(): "live" | "test" | "unknown" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { PLANS, type PlanKey } from "@/lib/plans";

// Server-side price ID resolvers (use env vars only on server)
export function getStripePriceId(plan: "starter" | "pro"): string {
  const key = plan === "starter" ? process.env.STRIPE_STARTER_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!key) throw new Error(`Missing Stripe price ID env var for plan: ${plan}`);
  return key;
}
