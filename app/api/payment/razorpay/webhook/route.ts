import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 400 });
  }

  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (signature !== expectedSignature) return NextResponse.json({ error: "Invalid Sig" }, { status: 400 });

  const event = JSON.parse(body);

  // 1. Subscription Management
  if (event.event === "subscription.activated" || event.event === "subscription.charged") {
    const sub = event.payload.subscription.entity;
    const { userId, plan } = sub.notes;

    if (userId && plan) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: plan }
      });

      // 2. GST Invoice Creation
      await prisma.invoice.create({
        data: {
          userId,
          externalId: event.payload.payment?.entity?.id || sub.id,
          amount: sub.paid_count === 0 ? 0 : sub.current_start, // logic for amounts
          gst: Math.floor(sub.current_start * 0.18), // 18% GST example
          plan,
          status: 'PAID'
        }
      });
    }
  }

  // 3. Subscription Termination
  if (event.event === "subscription.cancelled" || event.event === "subscription.completed") {
    const { userId } = event.payload.subscription.entity.notes;
    await prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
  }

  // 4. Refund Handling
  if (event.event === "refund.processed") {
    const { userId } = event.payload.payment.entity.notes;
    await prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
  }

  return NextResponse.json({ status: "ok" });
}