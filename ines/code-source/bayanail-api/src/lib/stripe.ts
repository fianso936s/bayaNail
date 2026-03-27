import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

// Only initialize Stripe if we have a valid key
// For development, you can get a test key from: https://dashboard.stripe.com/test/apikeys
if (!stripeKey || stripeKey.includes("your_") || stripeKey.includes("placeholder")) {
  console.warn(
    "⚠️  STRIPE_SECRET_KEY is not configured. Payment features will not work. " +
    "Set a valid STRIPE_SECRET_KEY in your .env file (e.g., sk_test_...)."
  );
}

// Initialize Stripe only if we have a valid key format (starts with sk_test_ or sk_live_)
const isStripeConfigured = stripeKey && 
  !stripeKey.includes("your_") && 
  !stripeKey.includes("placeholder") &&
  (stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_"));

const stripe = isStripeConfigured
  ? new Stripe(stripeKey!, {
      apiVersion: "2024-12-18.acacia" as any,
    })
  : (new Proxy({} as Stripe, {
      get() {
        throw new Error(
          "Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env file. " +
          "For development, get a test key from: https://dashboard.stripe.com/test/apikeys"
        );
      },
    }));

export default stripe;

