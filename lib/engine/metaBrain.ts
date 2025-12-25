import { AISignal, AssetClass, DecisionState } from '../../types';
import { AIFeatureVector } from '../features/featureEngine';
import { ExecutionPlanner } from './ExecutionPlanner';
import { InstitutionalGuard } from './InstitutionalGuard';
import { tradeJournal } from '../services/tradeJournal';
import { ProbabilityEngine } from '../probability/probabilityEngine';
import { EVFilter } from '../probability/expectedValue';
import { mlModel } from '../ml/logisticModel';
import { InstitutionalStrategies } from '../strategies/institutionalStrategies';

export class MetaBrain {
  async synthesize(symbol: string, features: AIFeatureVector, candles: any[]): Promise<AISignal> {
    const lastCandle = candles[candles.length - 1];
    const prevCandles = candles.slice(-20);
    const avgVol = prevCandles.reduce((s, c) => s + c.volume, 0) / 20;
    const volRelative = lastCandle.volume / (avgVol || 1);

    // 1. INSTITUTIONAL LOGIC NODES (PHASE 16)
    const smResult = InstitutionalStrategies.detectSmartMoney(volRelative, (lastCandle.close - lastCandle.open) / lastCandle.open * 100);
    const trapResult = InstitutionalStrategies.detectTrap(lastCandle.high, lastCandle.close, volRelative);
    const obi = InstitutionalStrategies.getOrderBookImbalance([{qty: 1200}], [{qty: 800}]); // Mock data

    // 2. RULE-BASED CALIBRATION
    const signals = {
      rsi: features.rsi,
      volumeSpike: volRelative,
      vwapDistance: features.trendScore, 
      momentum: features.rsiSlope,
      marketDepthImbalance: obi,
      volatility: features.volatility
    };
    const ruleResult = ProbabilityEngine.computeRuleBased(signals);
    
    // 3. ML-ENHANCED PREDICTION (PHASE 12)
    const featureVector = [
      ProbabilityEngine.normalize(features.rsi, 30, 70),
      ProbabilityEngine.normalize(volRelative, 1, 3),
      obi,
      Math.abs(features.trendScore),
      smResult ? smResult.score : 0.5,
      1 - (features.volatility * 10)
    ];
    const mlProb = mlModel.predict(featureVector);

    // 4. HYBRID ALPHA SYNTHESIS (PHASE 18)
    // Formula: 0.7 * rule + 0.3 * ml
    const finalProbability = (0.7 * ruleResult.probability) + (0.3 * mlProb);
    const finalConfidence = Math.abs(finalProbability - 0.5) * 2;

    // 5. EXPECTED VALUE FILTER (Institutional Barrier)
    // Using default ₹2500 Avg Win / ₹1000 Avg Loss for EV Calc
    const evCheck = EVFilter.isViable(finalProbability, 2500, 1000);

    // 6. DIRECTIONAL LOGIC
    let direction: "BUY" | "SELL" = features.trendAlignment === 1 ? 'BUY' : 'SELL';
    if (trapResult?.signal === 'BULL_TRAP') direction = 'SELL';

    // 7. EXECUTION PLANNING
    const plan = ExecutionPlanner.createPlan({
        symbol,
        side: direction,
        price: lastCandle.close,
        volatility: features.volatility,
        capital: 250000 
    });

    const guardResult = InstitutionalGuard.evaluate({
        symbol,
        probability: finalProbability,
        regimeConfidenceInput: {
          volatility: features.volatility,
          trendStrength: Math.abs(features.trendScore),
          volumeStability: 0.8
        },
        horizonInput: {
          ltf: features.rsiSlope, 
          mtf: features.trendScore, 
          htf: features.trendAlignment 
        },
        liquidityInput: {
          spread: 0.05, 
          depth: 12400, 
          rvol: volRelative
        },
        recentTrades: tradeJournal.getTrades(),
        signalAgeMinutes: 1 
    });

    return {
        id: `sig-${Date.now()}`,
        symbol,
        assetClass: AssetClass.EQUITY,
        action: direction,
        confidence: finalConfidence,
        probability: finalProbability,
        timestamp: new Date().toLocaleTimeString(),
        reasoning: `Hybrid Alpha: [Inst: ${smResult?.signal || 'Neutral'}] | [EV: ₹${evCheck.ev.toFixed(0)}] | [ML: ${(mlProb * 100).toFixed(0)}%]`,
        strategy: 'Sher Sovereign Ensemble',
        targets: { 
            entry: lastCandle.close, 
            sl: plan.stopLoss, 
            t1: plan.target, 
            t2: plan.target * 1.01 
        },
        decisionState: (guardResult.passed && evCheck.allowed) ? DecisionState.MATH_PROBABILITY_SYNCED : DecisionState.REJECTED,
        institutionalGuard: guardResult.telemetry,
        trapDetected: trapResult?.signal,
        smartMoneyFlow: smResult?.signal as AISignal['smartMoneyFlow']
    };
  }
}

export const metaBrain = new MetaBrain();