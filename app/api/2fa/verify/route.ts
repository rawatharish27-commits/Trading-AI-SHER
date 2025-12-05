
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  
  // SIMULATION: Accept '123456' as the correct code
  if (code === '123456') {
      // Update DB to enable 2FA
      // await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } })
      
      return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid code" }, { status: 400 });
}
