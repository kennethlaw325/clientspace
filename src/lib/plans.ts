// Shared plan config — safe to import in client components (no server SDK)

export const PLANS = {
  free: {
    name: "Free",
    priceId: null as string | null,
    price: 0,
    features: ["Up to 2 clients", "1 project per client", "100 MB storage"],
  },
  starter: {
    name: "Starter",
    priceId: null as string | null, // Resolved server-side via env
    price: 12,
    features: ["Up to 10 clients", "Unlimited projects", "5 GB storage", "Custom branding"],
  },
  pro: {
    name: "Pro",
    priceId: null as string | null, // Resolved server-side via env
    price: 29,
    features: ["Unlimited clients", "Unlimited projects", "50 GB storage", "Custom domain"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
