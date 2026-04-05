"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PRICES } from "@/lib/stripe/config";

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function getOrCreateCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createCheckoutMonthly(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const customerId = await getOrCreateCustomer(user.id, user.email!);
  const appUrl = getAppUrl();

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICES.PILOT_MONTHLY, quantity: 1 }],
    success_url: `${appUrl}/dashboard/costs?checkout=success`,
    cancel_url: `${appUrl}/dashboard/costs?checkout=cancel`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session");
  redirect(session.url);
}

export async function createCheckoutYearly(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const customerId = await getOrCreateCustomer(user.id, user.email!);
  const appUrl = getAppUrl();

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICES.PILOT_ANNUAL, quantity: 1 }],
    success_url: `${appUrl}/dashboard/costs?checkout=success`,
    cancel_url: `${appUrl}/dashboard/costs?checkout=cancel`,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  if (!session.url) throw new Error("Failed to create checkout session");
  redirect(session.url);
}

export async function createPortalSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error("No subscription found");
  }

  const appUrl = getAppUrl();

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings`,
  });

  redirect(session.url);
}
