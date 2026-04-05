import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// Price IDs from your Stripe dashboard (test mode)
export const PRICES = {
  PILOT_MONTHLY: process.env.STRIPE_PILOT_MONTHLY_PRICE_ID ?? "",
  PILOT_ANNUAL: process.env.STRIPE_PILOT_ANNUAL_PRICE_ID ?? "",
} as const;
