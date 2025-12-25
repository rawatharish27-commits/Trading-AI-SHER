
import { NextResponse } from "next/server";
import { reconciliationService } from "../../../../../lib/services/reconciliationService";

/**
 * 🔄 RECON TRIGGER ENDPOINT
 * Used by Cloud Run Cron or Admin Dashboard
 */
export async function POST() {
  try {
    await reconciliationService.reconcileAll();
    return NextResponse.json({ 
      status: "SUCCESS", 
      message: "Exchange OrderBook Synchronized.",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
