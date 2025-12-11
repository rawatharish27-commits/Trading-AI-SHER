import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "../../../../lib/prisma";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- Feature Engineering Helpers ---

function calculateSMA(data: number[], window: number): number {
  if (data.length < window) return 0;
  const slice = data.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / window;
}

function calculateRSI(data: number[], window: number = 14): number {
  if (data.length <= window) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - window; i < data.length; i++) {
    const difference = data[i] - data[i - 1];
    if (difference >= 0) gains += difference;
    else losses -= difference;
  }

  const avgGain = gains / window;
  const avgLoss = losses / window;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateVolatility(data: number[], window: number = 20): number {
  if (data.length < window) return 0;
  
  const slice = data.slice(-window);
  // Calculate Returns
  const returns = [];
  for (let i = 1; i < slice.length; i++) {
     returns.push((slice[i] - slice[i-1]) / slice[i-1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

// --- Main Route Handler ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, startDate, endDate } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const symbolUpper = symbol.toUpperCase();

    // 1. Fetch Historical Data (Using existing DB logic or Fallback Mock)
    let prices: number[] = [];
    
    const instrument = await prisma.instrument.findUnique({
      where: { symbol: symbolUpper },
    });

    if (instrument) {
      const candles = await prisma.candlePrice.findMany({
        where: { instrumentId: instrument.id, timeFrame: '1d' },
        orderBy: { timestamp: 'asc' },
        take: 100 // Need enough for indicators
      });
      prices = candles.map(c => c.close);
    }

    // Fallback if DB empty (Meta-Strategy needs data to run)
    if (prices.length < 50) {
      // Generate synthetic trend data
      let price = 1000;
      for (let i = 0; i < 100; i++) {
        const change = (Math.random() - 0.48) * 10;
        price += change;
        prices.push(price);
      }
    }

    // 2. Build Features
    const currentPrice = prices[prices.length - 1];
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const rsi = calculateRSI(prices);
    const volatility = calculateVolatility(prices);
    const momentum = prices[prices.length - 1] - prices[prices.length - 5];

    // 3. Run Meta-Strategy Controller (Via Gemini)
    const prompt = `
      Act as a Meta-Strategy Controller for an algorithmic trading system.
      Analyze the following market data for ${symbolUpper}:
      
      Technical Features:
      - Current Price: ${currentPrice.toFixed(2)}
      - SMA (20): ${sma20.toFixed(2)}
      - SMA (50): ${sma50.toFixed(2)}
      - RSI (14): ${rsi.toFixed(2)}
      - Volatility (20d): ${(volatility * 100).toFixed(2)}%
      - Momentum (5d): ${momentum.toFixed(2)}

      Tasks:
      1. Determine the Market Regime (BULL, BEAR, SIDEWAYS, or VOLATILE).
      2. Forecast probabilities for next movement (Up, Down, Flat) summing to 1.
      3. Rate suitability (0-10) for strategies: Momentum, Mean Reversion, Breakout.
      4. Provide a 2-sentence explanation of your decision logic.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            regime: { type: Type.STRING, enum: ["BULL", "BEAR", "SIDEWAYS", "VOLATILE"] },
            forecast: {
              type: Type.OBJECT,
              properties: {
                up: { type: Type.NUMBER },
                down: { type: Type.NUMBER },
                flat: { type: Type.NUMBER },
              }
            },
            strategySuitability: {
              type: Type.OBJECT,
              properties: {
                momentum: { type: Type.NUMBER },
                meanReversion: { type: Type.NUMBER },
                breakout: { type: Type.NUMBER }
              }
            },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    if (!response.text) {
        throw new Error("No analysis generated from AI Controller");
    }

    const analysis = JSON.parse(response.text);

    return NextResponse.json({
        symbol: symbolUpper,
        ...analysis,
        timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Meta-Strategy Controller Error:", error);
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
