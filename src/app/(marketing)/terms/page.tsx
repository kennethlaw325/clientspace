import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ClientSpace Terms of Service — the rules for using our platform.",
};

export default function TermsPage() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 2026</p>

        <div className="mt-8 space-y-8 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm leading-relaxed">
              By accessing or using ClientSpace, you agree to be bound by these Terms of
              Service. If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              2. Description of Service
            </h2>
            <p className="text-sm leading-relaxed">
              ClientSpace is a client portal platform for freelancers. It enables you to share
              files, track project progress, collect client approvals, and send invoices.
              We reserve the right to modify or discontinue the service at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              3. User Accounts
            </h2>
            <p className="text-sm leading-relaxed">
              You are responsible for maintaining the security of your account and for all
              activities that occur under your account. You must notify us immediately of any
              unauthorized use of your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              4. Acceptable Use
            </h2>
            <p className="text-sm leading-relaxed">
              You agree not to use ClientSpace for any unlawful purpose or in any way that
              could damage, disable, or impair the service. You are solely responsible for
              the content you upload and share through the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              5. Billing & Subscriptions
            </h2>
            <p className="text-sm leading-relaxed">
              Paid plans are billed monthly or annually in advance. You may cancel your
              subscription at any time. Refunds are handled on a case-by-case basis. Payment
              processing is handled by Stripe and subject to their terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              6. Limitation of Liability
            </h2>
            <p className="text-sm leading-relaxed">
              ClientSpace is provided &quot;as is&quot; without warranties of any kind.
              We shall not be liable for any indirect, incidental, or consequential damages
              arising from your use of the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              7. Contact
            </h2>
            <p className="text-sm leading-relaxed">
              For questions about these Terms, contact us at{" "}
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
              <strong>Note:</strong> This is a placeholder Terms of Service for development
              purposes. You should have this reviewed by a qualified legal professional before
              launching to the public.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
