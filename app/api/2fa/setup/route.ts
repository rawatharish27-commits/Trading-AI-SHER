
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// SIMULATING 2FA SETUP for Demo Environment
export async function POST(req: NextRequest) {
  // In real app, verify session here
  
  // 1. Generate Secret (Simulated)
  const manualKey = "JBSWY3DPEHPK3PXP"; // Base32 secret example
  
  // 2. Generate QR Code URL
  // Using a public API for demo visualization. In prod, use `qrcode` package server-side.
  const otpAuthUrl = `otpauth://totp/SherTrading:DemoUser?secret=${manualKey}&issuer=SherTrading`;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

  // 3. Store secret temporarily in DB (Simulated by returning it to client for demo state)
  // await prisma.user.update(...)

  return NextResponse.json({
    qrDataUrl,
    manualKey
  });
}
