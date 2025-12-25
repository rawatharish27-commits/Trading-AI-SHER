
import { InstitutionalTelemetry, GateStatus, AISignal, Trade } from '../../types';
import { RegimeConfidence } from './regime/RegimeConfidence';
import { HorizonAnalyzer } from './horizon/HorizonAnalyzer';
import { LiquidityEngine } from './liquidity/LiquidityEngine';
import { SurvivalGuard } from './risk/SurvivalGuard';
import { aiHealthMonitor } from '../services/aiHealthMonitor';

/**
 * 🏛️ SHER INSTITUTIONAL GUARD (V8 - ENTERPRISE)
 * Responsibility: Executing the 5 Sovereign Discipline Priorities with strict enterprise logic.
 */
export class InstitutionalGuard {
  /**
   * Evaluates a signal against the 5 High-Priority Institutional Gates.
   */
  static evaluate(params: {
    symbol: string;
    probability: number;
    regimeConfidenceInput: { volatility: number; trendStrength: number; volumeStability: number };
    horizonInput: { ltf: number; mtf: number; htf: number };
    liquidityInput: { spread: number; depth: number; rvol: number };
    recentTrades: Trade[];
    signalAgeMinutes: number;
  }): { passed: boolean; telemetry: InstitutionalTelemetry; finalProbability: number } {
    
    const gates: GateStatus[] = [];

    // 1. Regime Confidence (Priority #1)
    // Formula: Trend * 0.4 + VolStability * 0.3 + VolStability * 0.3
    const volStability = Math.max(0, 1 - (params.regimeConfidenceInput.volatility * 15));
    const regimeScore = (params.regimeConfidenceInput.trendStrength * 0.4) + 
                        (volStability * 0.3) + 
                        (params.regimeConfidenceInput.volumeStability * 0.3);
    const regimePassed = regimeScore >= 0.60;
    gates.push({ 
      id: 'regime', 
      label: 'Regime Weighting', 
      passed: regimePassed, 
      score: regimeScore * 100, 
      reason: regimePassed ? 'Regime clarity verified.' : 'High market entropy detected.' 
    });

    // 2. Multi-Horizon Sync (Priority #2)
    // Strict alignment: all must be in same direction
    const allPos = params.horizonInput.ltf > 0 && params.horizonInput.mtf > 0 && params.horizonInput.htf > 0;
    const allNeg = params.horizonInput.ltf < 0 && params.horizonInput.mtf < 0 && params.horizonInput.htf < 0;
    const horizonPassed = allPos || allNeg;
    gates.push({ 
      id: 'horizon', 
      label: 'Horizon Sync', 
      passed: horizonPassed, 
      score: horizonPassed ? 100 : 0, 
      reason: horizonPassed ? 'Full recursive alignment confirmed.' : 'Timeframe conflict detected.' 
    });

    // 3. Time-Decay (Priority #3)
    // Formula: p * exp(-t / halfLife)
    const halfLife = 30;
    const decayFactor = Math.exp(-params.signalAgeMinutes / halfLife);
    const probabilityDecayed = params.probability * decayFactor;
    const decayPassed = decayFactor > 0.85; // Reject if alpha decayed > 15%
    gates.push({ 
      id: 'decay', 
      label: 'Alpha Freshness', 
      passed: decayPassed, 
      score: Math.round(decayFactor * 100), 
      reason: decayPassed ? 'Fresh alpha shard.' : 'Signal aged; alpha decayed.' 
    });

    // 4. Liquidity stress (Priority #4)
    const liqRes = LiquidityEngine.evaluate(params.liquidityInput);
    gates.push({ 
      id: 'liquidity', 
      label: 'Execution Stress', 
      passed: liqRes.passed, 
      score: liqRes.score * 100, 
      reason: liqRes.reason 
    });

    // 5. Survival Guard (Priority #5)
    const survivalRes = SurvivalGuard.evaluate(params.recentTrades);
    gates.push({ 
      id: 'survival', 
      label: 'Survival Index', 
      passed: survivalRes.passed, 
      score: survivalRes.score * 100, 
      reason: survivalRes.reason 
    });

    // FINAL VETO CHECK: "No-Trade is a successful decision"
    const passed = gates.every(g => g.passed);

    // Sync Telemetry to Health Dashboard
    aiHealthMonitor.recordDecision({
      passed,
      probability: probabilityDecayed,
      reason: gates.find(g => !g.passed)?.label || 'CLEARED',
      isLossCluster: !survivalRes.passed
    });

    return {
      passed,
      finalProbability: probabilityDecayed,
      telemetry: {
        regimeConfidence: regimeScore,
        horizonAlignment: horizonPassed ? 1 : 0,
        liquidityBuffer: liqRes.score,
        survivalIndex: survivalRes.score,
        gates
      }
    };
  }
}
