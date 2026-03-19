export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Client<span className="text-indigo-500">Space</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-lg mx-auto">
          Simple client portal for freelancers. Share files, track progress,
          manage revisions, and get paid — all in one place.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/login"
            className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Get Started Free
          </a>
          <a
            href="#features"
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            Learn More
          </a>
        </div>
        <p className="text-sm text-slate-400 pt-2">
          Free forever for up to 2 clients. No credit card required.
        </p>
      </div>
    </main>
  );
}
