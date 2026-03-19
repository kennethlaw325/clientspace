import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export { PLANS, type PlanKey } from "@/lib/plans";

// Server-side price ID resolvers (use env vars only on server)
export function getStripePriceId(plan: "starter" | "pro"): string {
  const key = plan === "starter" ? process.env.STRIPE_STARTER_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!key) throw new Error(`Missing Stripe price ID env var for plan: ${plan}`);
  return key;
}
