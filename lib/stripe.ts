import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client (avoids throwing at import time when the
 *  key isn't set yet). */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}
