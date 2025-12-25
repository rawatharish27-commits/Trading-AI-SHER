
import { AISignal, SymbolAnalysis, StrategyStatus, AssetClass, DecisionState } from '../../types';
import { FeatureEngine, AIFeatureVector } from '../features/featureEngine';
import { analyzeSymbol } from '../../services/geminiService';
import { TechnicalEngine } from './technicalEngine';
import { FundamentalEngine } from './fundamentalEngine';
import { 
  SMACrossRSIStrategy, 
  EMAPullback, 
  RangeBreakout, 
  LiquiditySweepReversal,
  StrategyContext,
  MarketRegime
} from '../strategies';

export class MetaBrain {
  private strategies = [
    new SMACrossRSIStrategy(),
    new EMAPullback(),
    new RangeBreakout(),
    new LiquiditySweepReversal()
  ];

  /**
   * The core engine synthesis using Explainable AI (Module 3)
   */
  async synthesize(symbol: string, features: AIFeatureVector, candles: any[]): Promise<AISignal> {
    // 1. Fetch Incremental Weights from State
    // In production, these come from the Learner Node
    const strategyStats: Record<string, number> = JSON.parse(localStorage.getItem('sher_strat_weights') || '{}');

    // 2. Explainable Engines
    const techAudit = TechnicalEngine.analyze(candles);
    const fundAudit = FundamentalEngine.analyze(symbol);

    const ctx: StrategyContext = {
      prices: candles.map(c => c.close),
      candles: candles,
      rsi: techAudit.rsi,
      volatility: features.volatility,
      sma20: techAudit.ema20,
      sma50: techAudit.ema50,
      regime: this.deduceRegime(features)
    };

    // 3. Evaluate Candidate Strategies with Online Weighting
    const candidates = this.strategies
      .map(s => {
        const baseWeight = strategyStats[s.name] || 1.0;
        return {
          strategy: s,
          suitability: s.suitabilityScore(ctx) * baseWeight,
          triggered: s.checkConditions(ctx)
        };
      })
      .sort((a, b) => b.suitability - a.suitability);

    const primaryNode = candidates[0];

    // 4. Neural Deep Audit (Gemini)
    const neuralAudit = await analyzeSymbol(symbol);
    if (!neuralAudit) throw new Error("Neural bridge failure");

    // 5. Ensemble Probability Formulation
    // (Deterministic Bias * 0.4) + (Neural Confidence * 0.4) + (Fundamental Strength * 0.2)
    const techFactor = techAudit.bias === 'NEUTRAL' ? 0.5 : (techAudit.bias === 'BUY' ? techAudit.strength : techAudit.strength);
    const fundFactor = fundAudit.verdict === 'STRONG' ? 1 : (fundAudit.verdict === 'STABLE' ? 0.7 : 0.4);
    
    const ensembleProbability = (
      (techFactor * 0.4) + 
      (neuralAudit.probability * 0.4) + 
      (fundFactor * 0.2)
    );

    // Fix: Added missing 'decisionState' property to satisfy AISignal interface requirement.
    return {
      id: `sig-${Date.now()}`,
      symbol,
      assetClass: AssetClass.EQUITY,
      action: this.determineAction(techAudit.bias, neuralAudit.probability),
      confidence: neuralAudit.probability,
      probability: ensembleProbability,
      trapDetected: neuralAudit.trapRisk === 'HIGH' ? 'BULL_TRAP' : 'NONE',
      smartMoneyFlow: neuralAudit.smartMoneyFlow as AISignal['smartMoneyFlow'],
      timestamp: new Date().toLocaleTimeString(),
      reasoning: `Technical: ${techAudit.bias} | Weighting: x${(strategyStats[primaryNode.strategy.name] || 1).toFixed(2)} | Reasoning: ${neuralAudit.explanation}`,
      strategy: primaryNode.strategy.name,
      targets: neuralAudit.targets,
      decisionState: DecisionState.DISPATCH_READY
    };
  }

  private deduceRegime(f: AIFeatureVector): MarketRegime {
    if (f.isSqueezing) return 'COMPRESSION';
    if (f.volatility > 0.03) return 'VOLATILE';
    if (f.trendAlignment === 1) return 'BULL';
    if (f.trendAlignment === -1) return 'BEAR';
    return 'SIDEWAYS';
  }

  private determineAction(techBias: 'BUY' | 'SELL' | 'NEUTRAL', neuralProb: number): 'BUY' | 'SELL' | 'HOLD' {
    if (neuralProb > 0.75) return techBias === 'BUY' ? 'BUY' : 'SELL';
    return 'HOLD';
  }
}

export const metaBrain = new MetaBrain();
