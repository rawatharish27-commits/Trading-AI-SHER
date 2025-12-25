
import { NextRequest, NextResponse } from "next/server";
import { pnlService } from "../../../lib/services/pnlService";

/**
 * GET: Fetch the current live PnL snapshot from the global service.
 */
export async function GET(req: NextRequest) {
  try {
    const snapshot = pnlService.snapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: "PnL Data Unavailable" }, { status: 500 });
  }
}
