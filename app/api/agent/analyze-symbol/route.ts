import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "../../../../lib/prisma";
import { 
    SMACrossRSIStrategy, 
    RSIBollingerStrategy, 
    RangeBreakoutStrategy, 
    StrategyContext, 
    MarketRegime 
} from "../../../../lib/strategies";
import { MarketForecaster } from "../../../../lib/forecaster";

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

    // 3. Determine Market Regime Programmatically
    let regime: MarketRegime = 'SIDEWAYS';
    if (volatility > 0.025) {
        regime = 'VOLATILE';
    } else if (currentPrice > sma50 && sma20 > sma50) {
        regime = 'BULL';
    } else if (currentPrice < sma50 && sma20 < sma50) {
        regime = 'BEAR';
    }

    // 4. Calculate Algorithmic Strategy Scores
    const ctx: StrategyContext = { prices, rsi, volatility, sma20, sma50, regime };
    
    const momentumStrategy = new SMACrossRSIStrategy();
    const meanRevStrategy = new RSIBollingerStrategy();
    const breakoutStrategy = new RangeBreakoutStrategy();

    const scores = {
        momentum: momentumStrategy.suitabilityScore(ctx),
        meanReversion: meanRevStrategy.suitabilityScore(ctx),
        breakout: breakoutStrategy.suitabilityScore(ctx)
    };

    // 5. Run Quantitative Market Forecast
    // Tries to use ML models, falls back to Heuristic if unavailable
    const forecaster = new MarketForecaster();
    const forecast = await forecaster.predict({
        rsi,
        volatility,
        momentum,
        sma20,
        sma50,
        currentPrice
    });

    // 6. Run Meta-Strategy Controller (Via Gemini)
    // We pass the algorithmic scores AND the forecast as a baseline for the AI to refine
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
      
      Algorithmic Detection:
      - Detected Regime: ${regime}
      - Base Scores (0-10): Momentum=${scores.momentum}, MeanRev=${scores.meanReversion}, Breakout=${scores.breakout}

      Quantitative Forecast Model (${forecast.source}):
      - Direction: ${forecast.direction}
      - Confidence: ${(forecast.probability * 100).toFixed(1)}%
      - Predicted Return: ${forecast.predictedReturn}%

      Tasks:
      1. Confirm or adjust the Market Regime (BULL, BEAR, SIDEWAYS, VOLATILE).
      2. Forecast probabilities for next 24h movement (Up, Down, Flat) summing to 1.
         (Consider the ${forecast.source} model's prediction of ${forecast.direction} but use your reasoning).
      3. Refine the strategy suitability scores based on the holistic technical picture.
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