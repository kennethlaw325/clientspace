import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// In-memory rate limit store (resets on cold start / edge re-deploy)
// Key: "<ip>:<route-group>", Value: { count, windowStart }
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

// Rate limit configs per route group
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  // Stripe webhooks — low limit, should only come from Stripe
  "api/stripe/webhooks": { max: 100, windowMs: 60_000 },
  // Portal send-link — prevent email spam
  "api/portal/send-link": { max: 10, windowMs: 60_000 },
  // General API routes
  "api": { max: 200, windowMs: 60_000 },
};

function getRateLimitKey(pathname: string): string {
  for (const key of Object.keys(RATE_LIMITS)) {
    if (pathname.includes(key)) return key;
  }
  return "";
}

function checkRateLimit(ip: string, routeKey: string): boolean {
  const config = RATE_LIMITS[routeKey];
  if (!config) return true;

  const storeKey = `${ip}:${routeKey}`;
  const now = Date.now();
  const entry = rateLimitStore.get(storeKey);

  if (!entry || now - entry.windowStart > config.windowMs) {
    rateLimitStore.set(storeKey, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= config.max) return false;

  entry.count++;
  return true;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const routeKey = getRateLimitKey(pathname);
    if (routeKey && !checkRateLimit(ip, routeKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMITS[routeKey].max),
          },
        }
      );
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname === "/onboarding";

  const isAuthRoute = request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";

  // Not logged in → redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in → redirect away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  // Logged in + on dashboard → check workspace exists
  if (isProtectedRoute && user && request.nextUrl.pathname !== "/onboarding") {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
