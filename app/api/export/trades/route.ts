
import { NextRequest, NextResponse } from "next/server";
import { tradeJournal } from "../../../lib/services/tradeJournal";

export async function GET(req: NextRequest) {
  const trades = tradeJournal.getTrades();
  
  // Create CSV Header
  const headers = ["ID", "Symbol", "Side", "Quantity", "Entry Price", "Exit Price", "PnL", "Strategy", "Entry Time", "Status"];
  
  // Format Rows
  const rows = trades.map(t => [
    t.id,
    t.symbol,
    t.side,
    t.quantity,
    t.entryPrice,
    t.exitPrice || "N/A",
    t.pnl || "0",
    t.strategy,
    t.entryTime,
    t.status
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=sher_trade_journal.csv"
    }
  });
}
