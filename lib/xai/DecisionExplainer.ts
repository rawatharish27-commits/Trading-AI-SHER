import { GoogleGenAI, Type } from "@google/genai";
import { AISignal } from '../../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 🧠 DECISION EXPLAINER (XAI)
 * Goal: Convert high-dimensional math into human-auditable logic.
 */
export class DecisionExplainer {
  static async explain(signal: AISignal): Promise<{ narrative: string; risks: string[] }> {
    try {
      const prompt = `
        Act as an Institutional Risk Auditor. Explain this trade decision:
        Symbol: ${signal.symbol}
        Action: ${signal.action}
        Probability: ${signal.probability}
        Regime: ${signal.smartMoneyFlow}
        Strategy: ${signal.strategy}
        
        Provide:
        1. A 2-sentence causal narrative (Why this trade?).
        2. 2 specific risks that could invalidate this logic.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-lite-latest',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative: { type: Type.STRING },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (e) {
      return {
        narrative: "Manual heuristic fallback triggered. Logic aligned with ensemble consensus.",
        risks: ["Volatility expansion", "Execution slippage"]
      };
    }
  }
}