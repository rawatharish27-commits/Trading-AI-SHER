
import { GoogleGenAI, Type } from "@google/genai";
import { PortfolioItem, MarketTick, SymbolAnalysis, BacktestAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Deep Quantitative Reasoning for a Symbol using Gemini 3 Pro with Thinking.
 * Acts as the 'Alpha Auditor' layer.
 */
export const analyzeSymbol = async (symbol: string): Promise<SymbolAnalysis | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const prompt = `
      Act as SHER MASTER BRAIN - an institutional-grade quantitative meta-controller.
      Symbol: ${symbol}
      
      Requirements for AI Explainability Audit:
      1. Precise Regime Classification (TRENDING, RANGING, COMPRESSION).
      2. Detect Smart Money Flow (ACCUMULATION, DISTRIBUTION, NEUTRAL).
      3. Trap Risk Evaluation (LOW, MEDIUM, HIGH).
      4. Calculate Ensemble Probability (0-1).
      5. Provide 3-4 granular "Neural Causal Factors" (Why is the signal valid?).
      6. Targets: Entry, SL, T1, T2.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            regime: { type: Type.STRING },
            smartMoneyFlow: { type: Type.STRING },
            trapRisk: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            targets: {
                type: Type.OBJECT,
                properties: { entry: { type: Type.NUMBER }, sl: { type: Type.NUMBER }, t1: { type: Type.NUMBER }, t2: { type: Type.NUMBER } },
                required: ["entry", "sl", "t1", "t2"]
            },
            explanation: { type: Type.STRING },
            reasoning_points: { type: Type.ARRAY, items: { type: Type.STRING } },
            indicators_flagged: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["regime", "smartMoneyFlow", "trapRisk", "probability", "targets", "explanation", "reasoning_points", "indicators_flagged"]
        }
      }
    });

    if (response.text) {
        const analysis = JSON.parse(response.text.trim());
        return {
            symbol,
            ...analysis,
            timestamp: new Date().toISOString()
        } as SymbolAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Sher Alpha Auditor Error:", error);
    return null;
  }
};

/**
 * Tactical stock analysis using Gemini 3 Flash for speed.
 */
export const analyzeStock = async (symbol: string, price: number, change: number, strategy: string): Promise<string> => {
  if (!process.env.API_KEY) return "Simulation Mode: API Key missing.";
  try {
    const prompt = `Sher Meta-Controller Analyze: ${symbol} @ ${price} (${change}%). Strategy: ${strategy}. 1-sentence institutional alpha verdict.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Neural link stable.";
  } catch { return "Monitoring for breakout..."; }
};

export const analyzeBacktest = async (strategyName: string, winRate: number, drawdown: number, returnPct: number): Promise<BacktestAnalysis | null> => {
  if (!process.env.API_KEY) return null;
  try {
    const prompt = `Quant Audit: "${strategyName}". Win: ${winRate}%, DD: ${drawdown}%, Net: ${returnPct}%. Robustness eval.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ["riskScore", "verdict", "pros", "cons", "summary"]
        }
      }
    });
    return response.text ? JSON.parse(response.text.trim()) : null;
  } catch { return null; }
};

export const analyzePortfolio = async (holdings: PortfolioItem[]): Promise<string> => {
  if (!process.env.API_KEY) return "Handshake failed.";
  try {
    const summary = holdings.map(h => `${h.symbol}: ${h.pnlPercent.toFixed(2)}%`).join(', ');
    const prompt = `Risk Manager Audit: ${summary}. Identify concentration risk.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { thinkingConfig: { thinkingBudget: 2000 } } });
    return response.text || "Risk within deviation.";
  } catch { return "Monitoring critical breaches..."; }
};

export const generateMarketBrief = async (indices: { [key: string]: MarketTick }): Promise<string> => {
  if (!process.env.API_KEY) return "Simulation Mode.";
  try {
    const data = Object.values(indices).map(i => `${i.symbol}: ${i.changePercent.toFixed(2)}%`).join(', ');
    const prompt = `Market Snapshot: ${data}. 1-sentence institutional commentary.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Intelligence synchronized.";
  } catch { return "Monitoring operational."; }
};
