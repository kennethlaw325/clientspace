import Link from "next/link";
import type { Metadata } from "next";
import {
  Users,
  Upload,
  LayoutDashboard,
  FileText,
  CheckCircle,
  RefreshCw,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ClientSpace — Simple Client Portal for Freelancers",
  description:
    "Share files, track progress, collect approvals, and get paid — all in one place. The client portal freelancers deserve.",
  openGraph: {
    title: "ClientSpace — Simple Client Portal for Freelancers",
    description:
      "Share files, track progress, collect approvals, and get paid — all in one place.",
    url: "https://clientspace.app",
    siteName: "ClientSpace",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClientSpace — Simple Client Portal for Freelancers",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientSpace — Simple Client Portal for Freelancers",
    description:
      "Share files, track progress, collect approvals, and get paid — all in one place.",
    images: ["/og-image.png"],
  },
};

const features = [
  {
    icon: Upload,
    title: "File Sharing",
    description:
      "Upload deliverables and let clients download, preview, and request revisions. Keep everything in one place.",
  },
  {
    icon: LayoutDashboard,
    title: "Progress Tracking",
    description:
      "Track every project at a glance — status, deliverables, deadlines, and milestones. No more chasing updates.",
  },
  {
    icon: FileText,
    title: "Invoice Management",
    description:
      "Create and send professional invoices in seconds. Accept card payments via Stripe. Get paid faster.",
  },
  {
    icon: CheckCircle,
    title: "Client Approvals",
    description:
      "Collect structured feedback and sign-offs on deliverables. Clear approval trails, no more ambiguity.",
  },
  {
    icon: RefreshCw,
    title: "Revision Tracking",
    description:
      "Track revision rounds per deliverable so scope stays clear and you never lose track of feedback.",
  },
  {
    icon: Users,
    title: "Branded Portal",
    description:
      "Give each client their own portal with your branding. Magic link access — no passwords, no friction.",
  },
];

const steps = [
  {
    number: "1",
    title: "Sign up free",
    description: "Create your account in seconds. No credit card required.",
  },
  {
    number: "2",
    title: "Add your clients",
    description: "Set up client profiles and create projects for them.",
  },
  {
    number: "3",
    title: "Share your portal",
    description: "Send a magic link and your client sees everything they need.",
  },
];

const testimonials = [
  {
    quote:
      "ClientSpace replaced three different tools I was using. My clients love the simple portal and I love not having to chase invoices.",
    name: "Sarah K.",
    role: "Freelance Brand Designer",
    initials: "SK",
  },
  {
    quote:
      "The approval flow alone is worth it. No more back-and-forth emails trying to figure out if a client has signed off on a design.",
    name: "Marcus T.",
    role: "Freelance Web Developer",
    initials: "MT",
  },
  {
    quote:
      "My clients comment on how professional my process looks. They don't know it took me 10 minutes to set up.",
    name: "Priya L.",
    role: "UX/UI Consultant",
    initials: "PL",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <Star className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500" />
            Free forever for up to 2 clients
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            The client portal
            <br />
            <span className="text-indigo-500">freelancers deserve</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Share files, track progress, collect approvals, and get paid — all
            in one place. No more scattered emails and lost attachments.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required. Set up in under 5 minutes.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything you need to look professional
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Stop duct-taping tools together. ClientSpace has it all built in.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <feature.icon className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Three steps. That&apos;s it.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 text-white text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">
              Loved by freelancers
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Join thousands of freelancers who&apos;ve upgraded their client
              experience.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-700 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Start free. Upgrade when you grow. No surprises.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-block rounded-lg border border-indigo-500 px-8 py-3 text-base font-semibold text-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            View Pricing →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-500 py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Start for free today
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join freelancers who&apos;ve ditched the email chaos for a
            professional client experience.
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
