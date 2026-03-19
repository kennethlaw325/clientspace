import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
      <p className="text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
        Go home
      </Link>
    </div>
  );
}
