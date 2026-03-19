import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for freelancers. Free forever for up to 2 clients. Upgrade as you grow.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Perfect for getting started with your first clients.",
    cta: "Get Started Free",
    ctaHref: "/signup",
    highlighted: false,
    features: [
      "Up to 2 clients",
      "1 project per client",
      "100 MB storage",
      "Client portal",
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
    ctaHref: "/signup?plan=starter",
    highlighted: true,
    features: [
      "Up to 10 clients",
      "Unlimited projects",
      "5 GB storage",
      "Custom branding",
      "Invoicing & payments",
      "Client approvals",
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
    ctaHref: "/signup?plan=pro",
    highlighted: false,
    features: [
      "Unlimited clients",
      "Unlimited projects",
      "50 GB storage",
      "Custom domain",
      "Custom branding",
      "Invoicing & payments",
      "Client approvals",
      "Contracts & e-signatures",
      "Team members",
      "Priority support",
    ],
  },
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your subscription at any time from your billing settings. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "Do I need a credit card to sign up?",
    answer:
      "No. The Free plan requires no credit card. You only need to add a payment method when upgrading to a paid plan.",
  },
  {
    question: "What happens if I exceed my client limit?",
    answer:
      "You'll be prompted to upgrade before adding more clients. Your existing clients and data are never affected.",
  },
  {
    question: "Can my clients pay invoices through ClientSpace?",
    answer:
      "Yes. On Starter and Pro plans, you can send invoices and collect card payments via Stripe directly within ClientSpace.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We handle refund requests on a case-by-case basis. If you're not happy, reach out to hello@clientspace.app and we'll make it right.",
  },
  {
    question: "Is there an annual discount?",
    answer:
      "Yes. Paying annually saves you 28–31% compared to monthly. You can switch between billing cycles in your account settings.",
  },
];

export default function PricingPage() {
  return (
    <>
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
                  href={tier.ctaHref}
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

          {/* Trust note */}
          <p className="mt-8 text-center text-sm text-slate-500">
            All plans include SSL encryption, Supabase-backed data storage, and Stripe-secured
            payments. No setup fees.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-slate-600">
              Can&apos;t find your answer?{" "}
              <a
                href="mailto:hello@clientspace.app"
                className="text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
              >
                Email us
              </a>
              .
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-slate-900 list-none">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-500 py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join freelancers who&apos;ve already upgraded their client experience.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
          >
            Get Started Free
          </Link>
          <p className="mt-3 text-sm text-indigo-200">
            Free forever for up to 2 clients. No credit card required.
          </p>
        </div>
      </section>
    </>
  );
}
