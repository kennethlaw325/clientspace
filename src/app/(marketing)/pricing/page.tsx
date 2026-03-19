import Link from "next/link";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — ClientSpace",
  description:
    "Simple pricing for freelancers. Free forever for up to 2 clients.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Perfect for getting started with your first clients.",
    cta: "Get Started Free",
    highlighted: false,
    features: [
      "Up to 2 clients",
      "1 project per client",
      "100 MB storage",
      "Basic client portal",
      "Magic link access",
      "File sharing",
    ],
  },
  {
    name: "Starter",
    price: "$12",
    period: "/mo",
    annual: "$99/yr — save 31%",
    description: "For freelancers growing their client base.",
    cta: "Start Free Trial",
    highlighted: true,
    features: [
      "Up to 10 clients",
      "Unlimited projects",
      "5 GB storage",
      "Custom branding",
      "Invoicing",
      "Revision tracking",
      "Priority email support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    annual: "$249/yr — save 28%",
    description: "For agencies and power users who need it all.",
    cta: "Start Free Trial",
    highlighted: false,
    features: [
      "Unlimited clients",
      "Unlimited projects",
      "50 GB storage",
      "Custom domain",
      "Custom branding",
      "Contracts & e-signatures",
      "Team members",
      "Invoicing",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
            Start free. Upgrade as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                tier.highlighted
                  ? "border-indigo-500 shadow-lg shadow-indigo-100 ring-1 ring-indigo-500"
                  : "border-slate-200 bg-white"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {tier.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  {tier.price}
                </span>
                <span className="text-slate-500">{tier.period}</span>
                {tier.annual && (
                  <p className="mt-1 text-sm text-indigo-600 font-medium">
                    {tier.annual}
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Questions?{" "}
            <a
              href="mailto:hello@clientspace.app"
              className="text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
