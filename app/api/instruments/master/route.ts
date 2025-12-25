
import { NextResponse } from "next/server";
import axios from "axios";

/**
 * 🦁 INSTITUTIONAL REFERENCE DATA NODES
 * Part A: Multi-source fallback strategy.
 */
const PRIMARY_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const FALLBACK_URL = "https://raw.githubusercontent.com/angel-one/smartapi-javascript/main/resources/OpenAPIScripMaster.json";

async function fetchWithLogic(url: string, sourceName: string) {
  console.log(`🦁 [MasterProxy] Attempting sync with ${sourceName}...`);
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Sher-AI-Terminal/4.2',
      'Cache-Control': 'no-cache'
    }
  });
  if (!response.data || !Array.isArray(response.data)) {
    throw new Error(`Malformed data from ${sourceName}`);
  }
  return response.data;
}

export async function GET() {
  // 1. Primary Source
  try {
    const data = await fetchWithLogic(PRIMARY_URL, "Primary Exchange Node");
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=3600' }
    });
  } catch (primaryErr: any) {
    console.warn(`🟡 [MasterProxy] Primary Node Failed: ${primaryErr.message}. Shifting to Fallback...`);
  }

  // 2. Fallback Source
  try {
    const data = await fetchWithLogic(FALLBACK_URL, "Secondary GitHub Shard");
    console.log("✅ [MasterProxy] Fallback sync successful.");
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=1800' }
    });
  } catch (fallbackErr: any) {
    console.error("🔴 [MasterProxy] CRITICAL: All reference data sources unreachable.");
    // Return empty array instead of 500 to allow system boot with DB cache
    return NextResponse.json([], { status: 200 }); 
  }
}
