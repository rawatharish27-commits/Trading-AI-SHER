
import { MarketTick, MarketDepth } from '../../types';
import { depthNormalizer } from './depthNormalizer';

type ScenarioType = 'NORMAL' | 'FLASH_CRASH' | 'BULL_TRAP' | 'PARABOLIC_RUN';

interface SymbolState {
  basePrice: number;
  currentPrice: number;
  volatility: number; // Daily vol approx
  trend: number;      // Drift factor
  scenario: ScenarioType;
  scenarioTicksRemaining: number;
  momentum: number;
}

class MarketSimulatorEngine {
  private states: Map<string, SymbolState> = new Map();

  private getInitialState(symbol: string, startPrice: number): SymbolState {
    return {
      basePrice: startPrice,
      currentPrice: startPrice,
      volatility: 0.001, // 0.1% per tick approx
      trend: (Math.random() - 0.48) * 0.0001, // Slight bullish drift
      scenario: 'NORMAL',
      scenarioTicksRemaining: 0,
      momentum: 0,
    };
  }

  /**
   * Generates a realistic next tick based on symbol state and active scenarios.
   */
  generateTick(symbol: string, currentPrice: number): MarketTick {
    let state = this.states.get(symbol);
    if (!state) {
      state = this.getInitialState(symbol, currentPrice);
      this.states.set(symbol, state);
    }

    let drift = state.trend;
    let vol = state.volatility;

    // Scenario Logic
    if (state.scenarioTicksRemaining > 0) {
      state.scenarioTicksRemaining--;

      if (state.scenario === 'FLASH_CRASH') {
        drift = -0.008; // -0.8% per tick
        vol = 0.005;   // High uncertainty
      } else if (state.scenario === 'BULL_TRAP') {
        if (state.scenarioTicksRemaining > 15) {
          drift = 0.002; // Slow pump
        } else {
          drift = -0.012; // The "Trap" snaps
        }
      } else if (state.scenario === 'PARABOLIC_RUN') {
        drift = 0.004;
        vol = 0.002;
      }

      if (state.scenarioTicksRemaining === 0) {
        state.scenario = 'NORMAL';
        state.trend = (Math.random() - 0.5) * 0.0002; // New random trend
      }
    }

    // Apply Brownian Motion: Price = Price * (1 + drift + vol * Z)
    // Z is a random normal variable approx
    const z = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 3;
    const changePct = drift + (vol * z);
    const noise = currentPrice * changePct;
    const newPrice = currentPrice + noise;

    state.currentPrice = newPrice;

    return {
      symbol,
      price: newPrice,
      change: newPrice - state.basePrice,
      changePercent: ((newPrice - state.basePrice) / state.basePrice) * 100,
      timestamp: Date.now(),
      volume: Math.floor(Math.random() * 5000) + 1000
    };
  }

  /**
   * Generates a market depth object consistent with the current price state.
   */
  generateDepth(symbol: string, ltp: number): MarketDepth {
    const state = this.states.get(symbol);
    const depth = depthNormalizer.getMockDepth(ltp);

    // Manipulate depth based on scenarios
    if (state?.scenario === 'BULL_TRAP' && state.scenarioTicksRemaining > 15) {
      // Thin bids, heavy asks (fake pump)
      depth.bids.forEach(b => b.qty *= 0.3);
      depth.asks.forEach(a => a.qty *= 2.5);
    } else if (state?.scenario === 'FLASH_CRASH') {
      // Total liquidity evaporation
      depth.bids.forEach(b => b.qty *= 0.1);
      depth.asks.forEach(a => a.qty *= 0.1);
    }

    return depth;
  }

  /**
   * Triggers a specific market anomaly for testing.
   */
  triggerScenario(symbol: string, type: ScenarioType) {
    const state = this.states.get(symbol);
    if (!state) return;

    state.scenario = type;
    switch(type) {
      case 'FLASH_CRASH': state.scenarioTicksRemaining = 20; break;
      case 'BULL_TRAP': state.scenarioTicksRemaining = 30; break;
      case 'PARABOLIC_RUN': state.scenarioTicksRemaining = 50; break;
      default: state.scenarioTicksRemaining = 0;
    }
  }
}

export const marketSimulator = new MarketSimulatorEngine();
