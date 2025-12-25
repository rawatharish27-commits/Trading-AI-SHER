
import { GoogleGenAI, Type } from "@google/genai";
import { AISignal, TradeThesis, StrategyFeatures } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class ThesisBuilder {
  static async build(signal: AISignal, features: StrategyFeatures): Promise<TradeThesis> {
    if (!process.env.API_KEY) return this.fallbackThesis(signal);

    try {
        const prompt = `
            Act as an Institutional Fund Manager.
            Generate a Trade Thesis for: ${signal.action} ${signal.symbol}
            Momentum: ${features.momentumScore}, Trend: ${features.trendScore}, SM Flow: ${features.smartMoneyScore}
            
            Requirements:
            1. Headline summarizing the core idea.
            2. 3 bullets of supporting evidence.
            3. 2 risk warnings.
            4. Scenario Analysis: Bull Case vs Bear Case.
            5. Invalidation Point (where the thesis is proven wrong).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        supportingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
                        riskWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                        invalidationPoint: { type: Type.NUMBER },
                        scenarioAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                bullCase: { type: Type.STRING },
                                bearCase: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["headline", "supportingEvidence", "riskWarnings", "invalidationPoint", "scenarioAnalysis"]
                }
            }
        });

        return JSON.parse(response.text.trim()) as TradeThesis;
    } catch (e) {
        console.error("ThesisBuilder Failure:", e);
        return this.fallbackThesis(signal);
    }
  }

  // Fix: Return properly structured Evidence objects instead of strings to satisfy the Evidence[] requirement.
  private static fallbackThesis(signal: AISignal): TradeThesis {
    return {
        symbol: signal.symbol,
        direction: signal.action === 'HOLD' ? 'BUY' : signal.action as 'BUY' | 'SELL',
        headline: `Momentum Expansion detected in ${signal.symbol}`,
        supportingEvidence: [
          { type: 'MOMENTUM', description: "Price action above core EMAs", strength: 0.8, direction: 'BULLISH' },
          { type: 'VOLUME', description: "Positive Volume Delta", strength: 0.7, direction: 'BULLISH' }
        ],
        invalidationEvidence: [
          { type: 'RISK', description: "Market-wide correlation risk", strength: 0.4, direction: 'BEARISH' }
        ],
        thesisStrength: 75,
        invalidationPoint: signal.targets.sl
    };
  }
}
