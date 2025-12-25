
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { AngelOneAdapter } from "../../../../lib/brokers/angelOneAdapter";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { mode, exchangeTokens, config } = body;

    if (!mode || !exchangeTokens) {
      return NextResponse.json({ error: "Mode and Tokens required" }, { status: 400 });
    }

    // In a real environment, 'config' would be retrieved from encrypted DB
    const adapter = new AngelOneAdapter({
      apiKey: config?.apiKey || process.env.ANGEL_ONE_API_KEY || "",
      clientCode: config?.clientId || "",
      pin: config?.password || "",
      totp: "" // Handled via session persistence
    });

    const data = await adapter.getMarketData({ mode, exchangeTokens });
    
    if (!data) {
        return NextResponse.json({ error: "Failed to fetch from exchange core" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
