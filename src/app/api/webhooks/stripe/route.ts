import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.subscription
        ? (
            await stripe.subscriptions.retrieve(session.subscription as string)
          ).metadata.supabase_user_id
        : session.metadata?.supabase_user_id;

      if (!userId) {
        console.error("No supabase_user_id in session metadata");
        break;
      }

      const subscriptionId = session.subscription as string;
      const subscription =
        await stripe.subscriptions.retrieve(subscriptionId);

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "pilot",
          subscription_status: subscription.status,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          stripe_price_id:
            subscription.items.data[0]?.price.id ?? null,
          stripe_current_period_end: new Date(
            (subscription.items.data[0]?.current_period_end ?? 0) * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const isActive =
        subscription.status === "active" ||
        subscription.status === "trialing";

      await supabase
        .from("profiles")
        .update({
          subscription_tier: isActive ? "pilot" : "free",
          subscription_status: subscription.status,
          stripe_price_id:
            subscription.items.data[0]?.price.id ?? null,
          stripe_current_period_end: new Date(
            (subscription.items.data[0]?.current_period_end ?? 0) * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          stripe_price_id: null,
          stripe_current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
