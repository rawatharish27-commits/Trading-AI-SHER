import { AISignal, LiveOrder, AccountAllocation } from '../../types';
import { ComplianceService } from './complianceService';
import { AngelOneAdapter, OrderInput } from '../brokers/angelOneAdapter';
import { brokerConfigService } from './brokerConfigService';
import { OrderValidationService } from './orderValidationService';
import { SymbolResolver } from './symbolResolver';
import { ExecutionGuard } from './executionGuard';
import { RiskCore } from './risk/riskCore';

export class ExecutionService {
  /**
   * 🦁 INSTITUTIONAL EXECUTION NODE (Hardened v2)
   */
  static async executeLive(signal: AISignal, allocation: AccountAllocation): Promise<LiveOrder> {
    // EXECUTION KILL-SWITCH (NON-NEGOTIABLE)
    if (process.env.EXECUTION_ENABLED !== "true") {
      throw new Error("🚫 Live execution disabled");
    }

    const config = brokerConfigService.getConfig();

    if (!config.isConnected) {
      throw new Error("EXECUTION_HALT: Broker Bridge Disconnected.");
    }

    // 🛡️ PHASE 9: RISK CORE FIREWALL
    // Fix: Added await to async call to resolve "Property 'allowed' does not exist on type 'Promise'" errors.
    const riskCheck = await RiskCore.validateTrade();
    if (!riskCheck.allowed) {
      ComplianceService.log(config.clientId, 'RISK_GATE_VETO', { reason: riskCheck.reason, symbol: signal.symbol }, 'WARN');
      throw new Error(`RISK_CORE_VETO: ${riskCheck.reason}`);
    }

    // 1. STRICT RESOLUTION
    const instrument = await SymbolResolver.resolve(signal.symbol);

    const adapter = new AngelOneAdapter({
      apiKey: config.apiKey,
      clientCode: config.clientId,
      pin: config.password || "",
      totp: "" 
    });

    const orderParams: OrderInput = {
      variety: "NORMAL",
      tradingsymbol: instrument.tradingsymbol,
      symboltoken: instrument.token,
      transactiontype: signal.action === 'BUY' ? 'BUY' : 'SELL',
      exchange: "NSE",
      ordertype: "MARKET",
      producttype: "INTRADAY",
      duration: "DAY",
      price: signal.targets.entry,
      quantity: 10 // Basic Qty for node testing
    };

    // 2. SANITY AUDIT
    OrderValidationService.validateLiveOrder(orderParams);
    
    const marginOk = await OrderValidationService.validateMargin(adapter, orderParams);
    if (!marginOk) {
      throw new Error("EXECUTION_HALT: Margin breach in node.");
    }

    const liveOrder: LiveOrder = {
      id: `SHER-${Date.now()}`,
      symbol: signal.symbol,
      side: signal.action === 'BUY' ? 'BUY' : 'SELL',
      quantity: 10,
      type: 'MARKET',
      price: signal.targets.entry,
      status: 'PENDING',
      broker: 'ANGEL_ONE',
      timestamp: new Date().toISOString(),
      confidence: signal.probability
    };

    try {
      ComplianceService.log(config.clientId, 'ORDER_INIT', { params: orderParams }, 'INFO');

      // 3. ATOMIC DISPATCH WITH GUARD
      const result = await ExecutionGuard.executeSafely(
        () => adapter.placeOrder(orderParams),
        { signalId: signal.id, qty: 10 }
      );

      liveOrder.status = 'EXECUTED';
      liveOrder.id = result.orderid || liveOrder.id;
      
      // 🛡️ PHASE 9: Commit result to Risk State
      // Note: In production, pnl is updated via WebSocket postback.
      // This placeholder records the trade count.
      // Fix: Added await to async recordTrade call.
      await RiskCore.recordTrade(0); 

      ComplianceService.log(config.clientId, 'ORDER_SUCCESS', { orderId: liveOrder.id }, 'INFO');
      return liveOrder;

    } catch (e: any) {
      liveOrder.status = 'REJECTED';
      
      // 🛑 EMERGENCY: Failed dispatch often indicates infrastructure issues
      // Fix: Added await to async enableKillSwitch call.
      await RiskCore.enableKillSwitch("CRITICAL_DISPATCH_FAILURE");
      
      ComplianceService.log(config.clientId, 'ORDER_CRITICAL', { error: e.message }, 'CRITICAL');
      throw e;
    }
  }
}