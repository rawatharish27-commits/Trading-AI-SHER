import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");
  } catch (err: any) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // 1. Successful Recurring Payment
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const { userId, plan } = subscription.metadata;

    if (userId && plan) {
      await prisma.user.update({ where: { id: userId }, data: { plan } });
      
      await prisma.invoice.create({
        data: {
          userId,
          externalId: invoice.id,
          amount: invoice.amount_paid,
          gst: invoice.tax || 0,
          plan,
          status: 'PAID',
          pdfUrl: invoice.invoice_pdf
        }
      });
    }
  }

  // 2. Subscription Cancelled or Payment Failed
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const { userId } = sub.metadata;
    await prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
  }

  // 3. Refund Security
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    // Retrieve metadata from payment intent if not in charge
    const pi = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
    const { userId } = pi.metadata;
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
    }
  }

  return NextResponse.json({ received: true });
}