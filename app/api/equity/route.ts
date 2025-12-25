
import { NextRequest, NextResponse } from "next/server";
import { equityService } from "../../../lib/services/equityService";

export async function GET() {
  return NextResponse.json(equityService.snapshot());
}
