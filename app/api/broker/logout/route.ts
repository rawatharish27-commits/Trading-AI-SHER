import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { AngelOneAdapter } from "../../../../lib/brokers/angelOneAdapter";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = await req.json();
    const adapter = new AngelOneAdapter({
      apiKey: config.apiKey,
      clientCode: config.clientId,
      pin: config.password || "",
      totp: "" 
    });

    await adapter.logout();
    return NextResponse.json({ success: true, message: "Bridge Terminated Successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}