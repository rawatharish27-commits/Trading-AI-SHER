import { stripe } from "@/saas/stripe";

export async function getRevenue() {
  const charges = await stripe.charges.list({ limit: 50 });

  return charges.data.reduce(
    (sum, c) => sum + c.amount / 100,
    0
  );
}
