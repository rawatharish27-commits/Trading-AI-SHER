import { ExecutionIntent } from './types';

/**
 * ⚡ EXECUTION ROUTER
 * Goal: Minimize slippage and market impact.
 */
export class ExecutionRouter {
  static route(symbol: string, side: 'BUY' | 'SELL', qty: number, volatility: number, ltp: number): ExecutionIntent {
    
    // 1. Panic/Extreme Volatility Node
    if (volatility > 2.5) {
      return {
        symbol, side, quantity: Math.floor(qty * 0.5), // Reduce size in panic
        orderType: 'LIMIT',
        limitPrice: side === 'BUY' ? ltp * 0.998 : ltp * 1.002, // Wait for pullback
        slippageTolerance: 0.001
      };
    }

    // 2. High Volatility Node
    if (volatility > 1.2) {
      return {
        symbol, side, quantity: qty,
        orderType: 'AGGRESSIVE_LIMIT',
        limitPrice: side === 'BUY' ? ltp * 1.0005 : ltp * 0.9995,
        slippageTolerance: 0.002
      };
    }

    // 3. Normal Market Node
    return {
      symbol, side, quantity: qty,
      orderType: 'MARKET',
      slippageTolerance: 0.003
    };
  }
}