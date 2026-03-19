import { NextRequest, NextResponse } from "next/server";
import { stripe, getStripePriceId } from "@/lib/stripe";
import type { PlanKey } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan } = await req.json() as { plan: PlanKey };
    if (plan === "free") {
      return NextResponse.json({ error: "Cannot checkout to free plan" }, { status: 400 });
    }
    let priceId: string;
    try {
      priceId = getStripePriceId(plan as "starter" | "pro");
    } catch {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("owner_id", user.id)
      .single() as { data: { id: string; name: string } | null };
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    // Get or create Stripe customer
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("workspace_id", workspace.id)
      .single() as { data: { stripe_customer_id: string | null; stripe_subscription_id: string | null } | null };

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: workspace.name,
        metadata: { workspace_id: workspace.id, user_id: user.id },
      });
      customerId = customer.id;

      await admin.from("subscriptions").insert({
        workspace_id: workspace.id,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      });
    }

    // If already subscribed, redirect to portal instead
    if (sub?.stripe_subscription_id) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      });
      return NextResponse.json({ url: session.url });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: { workspace_id: workspace.id },
      subscription_data: {
        metadata: { workspace_id: workspace.id },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
