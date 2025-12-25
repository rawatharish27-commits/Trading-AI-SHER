
import { prisma } from "../prisma";
import { AngelOneAdapter } from "../brokers/angelOneAdapter";
import { brokerConfigService } from "./brokerConfigService";
import { pnlService } from "./pnlService";
import { lineageStore } from "../lineage/lineageStore";
import { OrderIntentService } from "../execution/orderIntentService";

/**
 * 🔄 SHER RECONCILIATION WORKER (HARDENED)
 * Goal: Primary truth reconciliation via exchange polling.
 */
class ReconciliationService {
  private isRunning = false;

  constructor() {
    if (typeof window === 'undefined') {
      setInterval(() => this.reconcileAll(), 30000); 
    }
  }

  async reconcileAll() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const config = brokerConfigService.getConfig();
      if (!config.isConnected) return;

      const adapter = new AngelOneAdapter();

      // 1. Fetch Exchange State
      const exchangeOrders = await adapter.getOrderBook();
      if (!Array.isArray(exchangeOrders)) return;

      // 2. Scan internal "Submitted" intents
      // In a real app, this queries the DB for status=PLACED_PENDING
      exchangeOrders.forEach(brokerOrder => {
        // Angel One uses 'clientorderid' if provided
        const intentId = brokerOrder.clientorderid || brokerOrder.orderid;
        const intent = OrderIntentService.getIntent(intentId);

        if (intent && intent.status === 'DISPATCHED') {
           const brokerStatus = brokerOrder.status.toLowerCase();
           
           if (brokerStatus === 'complete' || brokerStatus === 'executed') {
              OrderIntentService.updateStatus(intentId, 'RECONCILED');
              
              lineageStore.record({
                traceId: intent.traceId,
                eventType: 'FILL',
                symbol: intent.symbol,
                payload: { brokerOrder, finalStatus: 'FILLED' }
              });

              pnlService.onOrderUpdate({
                orderid: brokerOrder.orderid,
                tradingsymbol: brokerOrder.tradingsymbol,
                status: 'COMPLETE',
                transactiontype: brokerOrder.transactiontype,
                filledqty: parseInt(brokerOrder.filledshares || brokerOrder.quantity),
                avgprice: parseFloat(brokerOrder.averageprice || brokerOrder.price)
              });
           }
        }
      });

    } catch (e: any) {
      console.error("🦁 [Recon] Reconciliation Shard Failure:", e.message);
    } finally {
      this.isRunning = false;
    }
  }
}

export const reconciliationService = new ReconciliationService();
