import { NextRequest, NextResponse } from "next/server";
import { getStrategyPerformanceSummary, getActiveStrategies, getStrategies } from "@/lib/services/strategyManager";

export async function GET(req: NextRequest) {
  try {
    const summary = getStrategyPerformanceSummary();
    const activeStrategies = getActiveStrategies();
    const allStrategies = getStrategies();

    return NextResponse.json({
      success: true,
      data: {
        summary,
        activeStrategies,
        allStrategies
      }
    });
  } catch (error: any) {
    console.error("Strategy Status Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
