import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-slate-900">
            Client<span className="text-indigo-500">Space</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
              Client<span className="text-indigo-500">Space</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/pricing"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} ClientSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
