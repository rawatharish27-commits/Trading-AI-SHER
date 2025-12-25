import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import Razorpay from "razorpay";
import { PLANS_CONFIG } from "../../../../../lib/plans";
import { Plan } from "../../../../../types";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
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

    const subscription = await razorpay.subscriptions.create({
      plan_id: planConfig.gatewayIds.razorpay,
      customer_notify: 1,
      total_count: 12, // 1 year of monthly billing
      notes: {
        userId: (session.user as any).id,
        plan: plan,
      }
    });

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error("Razorpay Subscription Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}