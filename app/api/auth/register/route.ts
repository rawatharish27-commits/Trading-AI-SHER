
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required identity fields" }, { status: 400 });
    }

    // 1. Uniqueness Audit
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Identity already registered in neural registry" }, { status: 400 });
    }

    // 2. Cryptographic Hashing
    // Using 12 rounds for institutional balance between security and performance
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "TRADER", // Default role
        plan: "FREE"    // Default plan
      } as any
    });

    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      message: "Neural identity established" 
    });
  } catch (error) {
    console.error("Registration Core Error:", error);
    return NextResponse.json({ error: "Sovereign DB connection failed" }, { status: 500 });
  }
}
