import { NextRequest, NextResponse } from "next/server";
import { stripe, getStripePriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

function planFromPriceId(priceId: string | null | undefined): "free" | "starter" | "pro" {
  if (!priceId) return "free";
  try {
    if (priceId === getStripePriceId("starter")) return "starter";
    if (priceId === getStripePriceId("pro")) return "pro";
  } catch {
    // env vars might not be set; fall through to free
  }
  return "free";
}

function mapStatus(stripeStatus: Stripe.Subscription.Status): "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid" {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled": return "canceled";
    case "incomplete": return "incomplete";
    case "unpaid": return "unpaid";
    default: return "active";
  }
}

function getPeriodDates(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  };
}

function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (!parent) return null;
  if (parent.type === "subscription_details" && parent.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoice_id;
        if (invoiceId) {
          await admin.from("invoices").update({
            status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
          }).eq("id", invoiceId);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Invoice one-time payment
        if (session.mode === "payment") {
          const invoiceId = session.metadata?.invoice_id;
          if (invoiceId && session.payment_status === "paid") {
            await admin.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
          }
          break;
        }

        if (session.mode !== "subscription") break;

        const workspaceId = session.metadata?.workspace_id;
        if (!workspaceId) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const periods = getPeriodDates(subscription);

        await admin.from("subscriptions").upsert({
          workspace_id: workspaceId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan: planFromPriceId(priceId),
          status: mapStatus(subscription.status),
          ...periods,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: "workspace_id" });

        await admin.from("workspaces").update({ plan: planFromPriceId(priceId) }).eq("id", workspaceId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = getSubscriptionId(invoice);
        if (!subId) break;

        const subscription = await stripe.subscriptions.retrieve(subId);
        const priceId = subscription.items.data[0]?.price.id;
        const workspaceId = subscription.metadata?.workspace_id;
        const periods = getPeriodDates(subscription);

        await admin.from("subscriptions").update({
          status: mapStatus(subscription.status),
          ...periods,
          stripe_price_id: priceId,
          plan: planFromPriceId(priceId),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq("stripe_subscription_id", subId);

        if (workspaceId) {
          await admin.from("workspaces").update({ plan: planFromPriceId(priceId) }).eq("id", workspaceId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = getSubscriptionId(invoice);
        if (!subId) break;

        await admin.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;
        const workspaceId = subscription.metadata?.workspace_id;
        const periods = getPeriodDates(subscription);

        await admin.from("subscriptions").update({
          stripe_price_id: priceId,
          plan: planFromPriceId(priceId),
          status: mapStatus(subscription.status),
          ...periods,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq("stripe_subscription_id", subscription.id);

        if (workspaceId) {
          await admin.from("workspaces").update({ plan: planFromPriceId(priceId) }).eq("id", workspaceId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata?.workspace_id;

        await admin.from("subscriptions").update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
          stripe_price_id: null,
          cancel_at_period_end: false,
        }).eq("stripe_subscription_id", subscription.id);

        if (workspaceId) {
          await admin.from("workspaces").update({ plan: "free" }).eq("id", workspaceId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
