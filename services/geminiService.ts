import { GoogleGenAI, Type } from "@google/genai";
import { PortfolioItem, MarketTick, SymbolAnalysis, BacktestAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeStock = async (symbol: string, price: number, change: number, strategy: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment variables.";
  }

  try {
    const prompt = `
      You are Sher, an elite AI trading assistant. 
      Analyze the following instrument:
      - Symbol: ${symbol}
      - Current Price: ${price}
      - Daily Change: ${change}%
      - Detected Strategy Pattern: ${strategy}

      Provide a concise, professional trading analysis (max 100 words). 
      Focus on key support/resistance levels and immediate sentiment. 
      Do not provide financial advice, only technical analysis.
      Format the output as plain text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    return response.text || "Analysis could not be generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Temporary error connecting to Sher AI intelligence network.";
  }
};

export const analyzeBacktest = async (strategyName: string, winRate: number, drawdown: number, returnPct: number): Promise<BacktestAnalysis | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing.");
    return null;
  }

  try {
    const prompt = `
      You are a quantitative trading risk analyst. Review these backtest results for the strategy "${strategyName}":
      - Win Rate: ${winRate}%
      - Max Drawdown: ${drawdown}%
      - Total Return: ${returnPct}%

      Analyze the strategy for robustness, overfitting, and risk.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "Risk score 1-10 where 10 is extremely risky" },
            verdict: { type: Type.STRING, enum: ["ROBUST", "RISKY", "OVERFITTED"] },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as BacktestAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Gemini Backtest Analysis Error:", error);
    return null;
  }
};

export const analyzePortfolio = async (holdings: PortfolioItem[]): Promise<string> => {
  if (!process.env.API_KEY) return "API Key is missing.";

  try {
    const summary = holdings.map(h => 
      `- ${h.symbol}: ${h.quantity} units, P&L: ${h.pnlPercent}%`
    ).join('\n');

    const prompt = `
      As an expert portfolio risk manager, analyze these holdings:
      ${summary}
      
      Identify concentration risks and provide one strategic rebalancing suggestion. 
      Keep it under 50 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Portfolio Error:", error);
    return "Failed to analyze portfolio.";
  }
};

export const generateMarketBrief = async (indices: { [key: string]: MarketTick }): Promise<string> => {
  if (!process.env.API_KEY) return "API Key missing.";

  try {
    const data = Object.values(indices).map(i => `${i.symbol}: ${i.changePercent.toFixed(2)}%`).join(', ');
    const prompt = `
      Market Check: ${data}. 
      Give a 1-sentence witty market commentary in the style of a Wall Street veteran.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Market is moving.";
  } catch (error) {
    return "Market briefing unavailable.";
  }
};

/**
 * Agent Tool: analyze_symbol
 * Fetches historical data, builds features, and runs the Meta-Strategy Controller via the API.
 */
export const analyzeSymbol = async (symbol: string, startDate?: string, endDate?: string): Promise<SymbolAnalysis | null> => {
  try {
    const response = await fetch('/api/agent/analyze-symbol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, startDate, endDate })
    });
    
    if (!response.ok) {
        console.error("Failed to analyze symbol:", await response.text());
        return null;
    }
    
    return await response.json();
  } catch (e) {
    console.error("Agent Tool Error:", e);
    return null;
  }
};
