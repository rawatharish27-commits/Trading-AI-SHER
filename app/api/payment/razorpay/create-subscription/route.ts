import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/react";
import { authOptions } from "@/lib/auth";
import Razorpay from "@/lib/razorpay";
import { PLANS_CONFIG } from "@/lib/plans";
import { Plan } from "@/types/global";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await req.json();
    const plan = planId as Plan;
    const planConfig = PLANS_CONFIG[plan];

    if (!planConfig || !planConfig.gatewayIds.razorpay) {
      return NextResponse.json({ error: "Invalid Subscription Plan" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: planConfig.price * 100, // Razorpay expects amount in paise
      currency: planConfig.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: (session.user as any).id,
        plan: plan,
      },
    });

    return NextResponse.json({ id: order.id });
  } catch (error: any) {
    console.error("Razorpay Subscription Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
