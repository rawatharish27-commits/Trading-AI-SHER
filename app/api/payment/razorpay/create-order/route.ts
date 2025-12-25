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

    if (!PLANS_CONFIG[plan]) {
      return NextResponse.json({ error: "Invalid Plan" }, { status: 400 });
    }

    const options = {
      amount: PLANS_CONFIG[plan].amount,
      currency: PLANS_CONFIG[plan].currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: (session.user as any).id,
        plan: plan,
      }
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
