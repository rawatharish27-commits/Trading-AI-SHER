import { NextRequest, NextResponse } from "next/server";
import { logger } from "../utils/logger";

/**
 * 🔁 GLOBAL API WRAPPER
 * Goal: Hardened error isolation and request tracing.
 */
export function withSherGuard(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const requestId = req.headers.get('x-request-id') || Math.random().toString(36).substr(2, 9);

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;
      
      // Trace successful execution
      if (duration > 1000) {
        logger.warn(`🦁 [SlowRequest] ${req.nextUrl.pathname} took ${duration}ms`, { requestId });
      }

      return response;
    } catch (err: any) {
      logger.error(`🦁 [ApiHalt] ${req.nextUrl.pathname} failed`, err);
      
      return NextResponse.json({
        error: "Internal Neural Failure",
        message: process.env.NODE_ENV === 'development' ? err.message : "Request could not be sharded.",
        traceId: requestId
      }, { status: 500 });
    }
  };
}
