import Link from "next/link";
import {
  Users,
  Upload,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Client Portal",
    description:
      "Give each client their own branded portal to view projects, files, and updates.",
  },
  {
    icon: Upload,
    title: "File Sharing",
    description:
      "Upload deliverables and let clients download, preview, and request revisions.",
  },
  {
    icon: LayoutDashboard,
    title: "Project Dashboard",
    description:
      "Track every project at a glance — status, deliverables, deadlines, and progress.",
  },
  {
    icon: MessageSquare,
    title: "Messaging",
    description:
      "Keep conversations in context. No more digging through email threads.",
  },
  {
    icon: RefreshCw,
    title: "Revision Tracking",
    description:
      "Track revision rounds per deliverable so scope stays clear for everyone.",
  },
  {
    icon: LinkIcon,
    title: "Magic Links",
    description:
      "Clients access their portal with a single link — no passwords, no friction.",
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

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            The client portal
            <br />
            <span className="text-indigo-500">freelancers deserve</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Share files, track progress, manage revisions, and get paid — all in
            one place. No more scattered emails and lost attachments.
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
              Learn More
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Free forever for up to 2 clients. No credit card required.
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

      {/* Pricing preview */}
      <section className="py-24 px-6">
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
            View Pricing
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
        </div>
      </section>
    </>
  );
}
