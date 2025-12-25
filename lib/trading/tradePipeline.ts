import { ProbabilityEngine, SignalInput } from "../probability/probabilityEngine";
import { EVFilter } from "../probability/expectedValue";
import { RiskCore } from "../services/risk/riskCore";
import { AngelOneAdapter, OrderInput } from "../brokers/angelOneAdapter";
import { SymbolResolver } from "../services/symbolResolver";
import { TradeAuditService } from "../services/tradeAuditService";

/**
 * 🦁 SOVEREIGN ALPHA PIPELINE (PHASE 11-14)
 * Goal: Zero-Discretionary execution based on calibrated math.
 */
export class TradePipeline {
  static async execute(params: {
    symbol: string;
    signals: SignalInput;
    side: 'BUY' | 'SELL';
    quantity: number;
    avgWin: number;
    avgLoss: number;
    userId: string;
  }) {
    console.log(`🧠 [Pipeline] Auditing ${params.symbol} Alpha Node...`);

    // 1. PROBABILITY ENGINE CALIBRATION
    const probResult = ProbabilityEngine.computeRuleBased(params.signals);
    
    // 2. EXPECTED VALUE GATE
    const evResult = EVFilter.isViable(probResult.probability, params.avgWin, params.avgLoss);
    
    if (!evResult.allowed) {
      console.warn(`🛡️ [Pipeline] VETO: Negative Expected Value (₹${evResult.ev.toFixed(0)})`);
      return { status: 'REJECTED', reason: 'NEGATIVE_EV', ev: evResult.ev };
    }

    // 3. INSTITUTIONAL RISK FIREWALL
    const riskCheck = await RiskCore.validateTrade();
    if (!riskCheck.allowed) {
      return { status: 'REJECTED', reason: riskCheck.reason };
    }

    // 4. BROKER RESOLUTION & DISPATCH
    try {
      const instrument = await SymbolResolver.resolve(params.symbol);
      const adapter = new AngelOneAdapter();
      
      const orderParams: OrderInput = {
        variety: "NORMAL",
        tradingsymbol: instrument.tradingsymbol,
        symboltoken: instrument.token,
        transactiontype: params.side,
        exchange: "NSE",
        ordertype: "MARKET",
        producttype: "INTRADAY",
        duration: "DAY",
        price: 0, // Market
        quantity: params.quantity
      };

      const result = await adapter.placeOrder(orderParams);
      
      // 5. COMPLIANCE AUDIT LOGGING
      await TradeAuditService.log({
        userId: params.userId,
        symbol: params.symbol,
        side: params.side,
        quantity: params.quantity,
        price: params.signals.volatility, // Proxied for mock
        pnl: 0, // Pending settlement
        strategy: 'Sher Calibrated Ensemble',
        reason: `Prob: ${(probResult.probability * 100).toFixed(0)}% | EV: ₹${evResult.ev.toFixed(0)}`
      });

      // 6. RECORD TO RISK STATE
      await RiskCore.recordTrade(0);

      return { 
        status: 'EXECUTED', 
        orderId: result.orderid, 
        probability: probResult.probability,
        ev: evResult.ev 
      };

    } catch (e: any) {
      console.error("🦁 [Pipeline] Dispatch Failure:", e.message);
      return { status: 'FAILED', error: e.message };
    }
  }
}
