
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { AngelOneAdapter } from "../../../../../lib/brokers/angelOneAdapter";
import { brokerConfigService } from "../../../../../lib/services/brokerConfigService";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const config = brokerConfigService.getConfig();
    const adapter = new AngelOneAdapter({
      apiKey: config.apiKey,
      clientCode: config.clientId,
      pin: config.password || "",
      totp: "" 
    });

    const holdingsData = await adapter.getAllHolding();
    return NextResponse.json(holdingsData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
