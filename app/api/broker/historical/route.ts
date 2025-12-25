
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { AngelOneAdapter, HistoricalParams } from "../../../../lib/brokers/angelOneAdapter";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { exchange, symboltoken, interval, fromdate, todate, type = 'CANDLE', config } = body;

    if (!exchange || !symboltoken || !interval || !fromdate || !todate) {
      return NextResponse.json({ error: "Required historical parameters missing" }, { status: 400 });
    }

    const adapter = new AngelOneAdapter({
      apiKey: config?.apiKey || process.env.ANGEL_ONE_API_KEY || "",
      clientCode: config?.clientId || "",
      pin: config?.password || "",
      totp: "" 
    });

    const params: HistoricalParams = { exchange, symboltoken, interval, fromdate, todate };
    
    let data;
    if (type === 'OI') {
        data = await adapter.getHistoricalOI(params);
    } else {
        data = await adapter.getHistoricalCandles(params);
    }

    if (!data) {
        return NextResponse.json({ error: "Exchange returned null dataset" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
