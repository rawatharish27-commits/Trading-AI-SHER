
import { NextRequest, NextResponse } from "next/server";
import { AngelOneAdapter } from "../../../../lib/brokers/angelOneAdapter";
import { generateTOTP } from "../../../../lib/brokers/totp";

export async function POST(req: NextRequest) {
  try {
    const config = await req.json();
    
    if (!config.apiKey || !config.clientId || !config.totpSecret || !config.password) {
        return NextResponse.json({ error: "API Key, Client Code, PIN, and TOTP Secret are required" }, { status: 400 });
    }

    // 1. Generate real-time TOTP
    const totp = generateTOTP(config.totpSecret);
    
    // 2. Instantiate Production Adapter
    const angel = new AngelOneAdapter({
      apiKey: config.apiKey,
      clientCode: config.clientId,
      pin: config.password,
      totp: totp
    });

    // 3. Perform Handshake
    const tokens = await angel.login();
    
    // Successful handshake established
    return NextResponse.json({ 
        success: true, 
        message: "Angel One SmartAPI Session Established",
        session: {
            jwtToken: tokens.jwt,
            feedToken: tokens.feed
        }
    });
  } catch (e: any) {
      console.error("[BrokerBridge] Connection Error:", e.message);
      return NextResponse.json({ 
        error: e.message || "Authentication Failed" 
      }, { status: 500 });
  }
}
