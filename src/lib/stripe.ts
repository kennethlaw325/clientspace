import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
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
