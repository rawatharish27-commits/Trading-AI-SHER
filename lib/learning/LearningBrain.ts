import { ExperienceShard } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { eventBus } from '../engine/eventBus';

/**
 * 🧠 LEARNING BRAIN
 * Goal: Close the loop between Signal and Outcome.
 */
export class LearningBrain {
  private static memory: ExperienceShard[] = [];
  private static ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  static async ingestOutcome(shard: ExperienceShard) {
    this.memory.push(shard);
    if (this.memory.length > 500) this.memory.shift();

    // 1. Quantitative Feedback: Log for audit
    eventBus.emit('audit.log', { 
      msg: `Outcome Ingested: ${shard.symbol} ${shard.actualOutcome}`,
      pnl: shard.pnlPoints 
    }, 'LEARNING_BRAIN');

    // 2. Qualitative Feedback: Reasoning over losses using Gemini
    if (shard.actualOutcome === 'LOSS' && Math.random() > 0.7) {
      await this.performPostMortem(shard);
    }
  }

  /**
   * 🔬 POST-MORTEM ENGINE
   * Uses Gemini to find "Why" a high-probability trade failed.
   */
  private static async performPostMortem(shard: ExperienceShard) {
    try {
      const prompt = `
        Act as a Quant Auditor. A high-probability trade failed.
        Symbol: ${shard.symbol}
        Regime: ${shard.regime}
        Predicted Probability: ${shard.predictedProb}
        Outcome: ${shard.actualOutcome}
        PnL: ${shard.pnlPoints}
        Context Snapshot: ${JSON.stringify(shard.contextSnapshot)}
        
        Analyze why this trade might have failed. Was it a noise trigger, a regime shift, or slippage?
        Provide analysis in JSON format with 'tags' (MistakeType) and 'narrative'.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Possible values: REGIME_MISCLASSIFICATION, FALSE_POSITIVE, LATE_EXIT, SLIPPAGE_EXCESS, NOISE_TRIGGER"
              },
              narrative: { type: Type.STRING }
            },
            required: ["tags", "narrative"]
          }
        }
      });

      const audit = JSON.parse(response.text || '{}');
      console.log(`🦁 [PostMortem] Node ${shard.id} analyzed: ${audit.narrative}`);
      
      eventBus.emit('audit.log', { 
        msg: `AI Post-Mortem complete for ${shard.symbol}`,
        analysis: audit.narrative,
        tags: audit.tags 
      }, 'LEARNING_BRAIN');

    } catch (e) {
      console.error("PostMortem Shard Failure", e);
    }
  }

  static getMemory() { return this.memory; }
}