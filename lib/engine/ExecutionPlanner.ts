import { ExecutionPlan } from '../../types';

export class ExecutionPlanner {
  static createPlan(params: {
    symbol: string,
    side: 'BUY' | 'SELL',
    price: number,
    volatility: number,
    capital: number
  }): ExecutionPlan {
    
    // Volatility based Stop Loss (e.g., 2.0 x ATR equivalent)
    const slPct = Math.max(0.01, params.volatility * 1.5);
    const stopLoss = params.side === 'BUY' 
      ? params.price * (1 - slPct) 
      : params.price * (1 + slPct);

    // Target (Risk Reward 1:2.5)
    const risk = Math.abs(params.price - stopLoss);
    const target = params.side === 'BUY'
      ? params.price + (risk * 2.5)
      : params.price - (risk * 2.5);

    // Position Sizing (Fixed 1% Capital Risk)
    const riskAmount = params.capital * 0.01;
    const quantity = Math.floor(riskAmount / risk);

    return {
      symbol: params.symbol,
      side: params.side,
      quantity: Math.max(1, quantity),
      entryType: 'MARKET',
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      target: parseFloat(target.toFixed(2))
    };
  }
}