import "server-only";
import { NextResponse } from "next/server";
import { runGemini } from "@/core/ai/geminiClient";
import { runFallback } from "@/core/ai/fallbackEngine";
import { rateLimit } from "@/infra/rateLimiter";
import { sebiWrap } from "@/compliance/sebi";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await rateLimit(body.userId);

    let result;
    try {
      result = await runGemini(body);
    } catch {
      result = await runFallback(body);
    }

    return NextResponse.json(sebiWrap(result));
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 429 }
    );
  }
}
