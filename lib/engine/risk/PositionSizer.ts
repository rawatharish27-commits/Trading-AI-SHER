export class PositionSizer {
  private static readonly KELLY_FRACTION = 0.3; // Conservative 30% Kelly (Institutional safety)
  private static readonly MAX_PORTFOLIO_RISK = 0.02; // Max 2% capital per trade node

  /**
   * 🧮 HYBRID POSITION SIZING
   * Formula: Kelly(p, b) -> Volatility Adjustment -> Hard Safety Cap
   */
  static calculate(params: {
    symbol: string;
    probability: number; // 0.0 - 1.0
    rewardRisk: number;
    capital: number;
    price: number;
    volatility: number;
  }): number {
    if (params.probability < 0.70) return 0; // Confidence gate

    // 1. Core Kelly Math: f* = (bp - q) / b
    const p = params.probability;
    const q = 1 - p;
    const b = params.rewardRisk;

    let kellyF = (b * p - q) / b;
    if (kellyF <= 0) return 0;

    // 2. Apply Conservative Sharding
    const safeF = kellyF * this.KELLY_FRACTION;
    
    // 3. Volatility Adjustment (Risk Parity Shard)
    // Higher Vol -> Smaller Size (Reference 1% target vol)
    const volAdj = 0.01 / Math.max(params.volatility, 0.005);
    const finalF = Math.min(safeF, this.MAX_PORTFOLIO_RISK) * volAdj;

    // 4. Calculate Final Units
    const rawQty = (params.capital * finalF) / params.price;
    const finalQty = Math.floor(rawQty);

    return finalQty;
  }
}