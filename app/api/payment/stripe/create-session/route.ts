import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import Stripe from "stripe";
import { PLANS_CONFIG } from "../../../../../lib/plans";
import { Plan } from "../../../../../types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await req.json();
    const plan = planId as Plan;

    if (!PLANS_CONFIG[plan]) {
      return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PLANS_CONFIG[plan].currency.toLowerCase(),
            product_data: {
              name: `SHER AI - ${PLANS_CONFIG[plan].name}`,
            },
            unit_amount: PLANS_CONFIG[plan].amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?payment=cancelled`,
      metadata: {
        userId: (session.user as any).id,
        plan: plan,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
