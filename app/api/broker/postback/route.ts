import { NextRequest, NextResponse } from "next/server";
import { pnlService } from "../../../../lib/services/pnlService";
import { ComplianceService } from "../../../../lib/services/complianceService";

/**
 * Angel One Postback/Webhook Endpoint.
 * Receives real-time POST requests from Angel One for order status changes.
 * Requirements: Port 443 (HTTPS), JSON Content-Type.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || !payload.orderid) {
      return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
    }

    // 1. Log to Institutional Compliance Node
    ComplianceService.log(
      payload.clientcode || "SYSTEM", 
      "BROKER_POSTBACK_RECEIVED", 
      { 
        orderId: payload.orderid, 
        symbol: payload.tradingsymbol, 
        status: payload.orderstatus,
        fill: payload.filledshares 
      },
      payload.orderstatus === 'rejected' ? 'WARN' : 'INFO'
    );

    // 2. Synchronize P&L and Position State
    pnlService.onPostbackUpdate(payload);

    // 3. Dispatch Global Event for UI updates (if needed)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sher-postback-update', { detail: payload }));
    }

    console.info(`🦁 [Postback] Order ${payload.orderid} (${payload.tradingsymbol}) updated to ${payload.orderstatus}`);

    return NextResponse.json({ status: "SUCCESS" });
  } catch (error: any) {
    console.error("🦁 [Postback] Critical Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}