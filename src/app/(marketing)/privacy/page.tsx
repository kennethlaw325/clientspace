import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ClientSpace Privacy Policy — how we collect and use your data.",
};

export default function PrivacyPage() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 2026</p>

        <div className="mt-8 prose prose-slate max-w-none space-y-8 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              1. Information We Collect
            </h2>
            <p className="text-sm leading-relaxed">
              We collect information you provide directly to us, such as when you create an
              account, add clients, or contact support. This includes your name, email address,
              and any content you upload to ClientSpace.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              2. How We Use Your Information
            </h2>
            <p className="text-sm leading-relaxed">
              We use the information we collect to provide, maintain, and improve ClientSpace,
              process transactions, send transactional emails, and respond to your requests.
              We do not sell your personal data to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              3. Data Storage & Security
            </h2>
            <p className="text-sm leading-relaxed">
              Your data is stored securely using Supabase (PostgreSQL) hosted on infrastructure
              with industry-standard encryption at rest and in transit. We use Stripe for payment
              processing — we never store your card details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              4. Cookies
            </h2>
            <p className="text-sm leading-relaxed">
              We use essential cookies to maintain your session and authentication state.
              We do not use tracking or advertising cookies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              5. Your Rights
            </h2>
            <p className="text-sm leading-relaxed">
              You may request access to, correction of, or deletion of your personal data at
              any time by contacting us at{" "}
              <a
                href="mailto:hello@clientspace.app"
                className="text-indigo-600 hover:text-indigo-700"
              >
                hello@clientspace.app
              </a>
              . We will respond within 30 days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              6. Contact Us
            </h2>
            <p className="text-sm leading-relaxed">
              If you have questions about this Privacy Policy, contact us at{" "}
              <a
                href="mailto:hello@clientspace.app"
                className="text-indigo-600 hover:text-indigo-700"
              >
                hello@clientspace.app
              </a>
              .
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This is a placeholder privacy policy for development
              purposes. You should have this reviewed by a qualified legal professional before
              launching to the public.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
