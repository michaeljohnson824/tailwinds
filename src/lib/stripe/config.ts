import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// Price IDs from your Stripe dashboard (test mode)
export const PRICES = {
  PILOT_MONTHLY: process.env.STRIPE_PRICE_PILOT_MONTHLY!,
  PILOT_YEARLY: process.env.STRIPE_PRICE_PILOT_YEARLY!,
} as const;
