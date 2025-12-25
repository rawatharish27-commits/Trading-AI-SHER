import { AISignal, OrderUpdate } from '../../types';
import { governanceService } from './governanceService';
import { capitalAllocator } from './capitalAllocator';
import { pnlService } from './pnlService';
import { ComplianceGuard } from '../compliance/ComplianceGuard';
import { AuditVault } from '../audit/AuditVault';

class ExecutionEngine {
  private activeOrders: Set<string> = new Set();

  async autoExecute(signal: AISignal) {
    if (!governanceService.isServiceActive('automatedExecution')) return;
    if (this.activeOrders.has(signal.symbol)) return;

    // --- PHASE 6: COMPLIANCE HANDSHAKE ---
    const audit = await ComplianceGuard.auditBeforeExecution(signal, 'NODE_OWNER');
    if (!audit.approved) {
      console.warn(`🦁 [Compliance] VETO: ${audit.reason}`);
      AuditVault.log({ event: 'EXECUTION_VETOED', signal: signal.id, reason: audit.reason });
      return;
    }

    console.log(`[AutoExec] ⚡ AUDIT PASSED: ${signal.symbol} (Ref: ${audit.auditRef?.slice(0,8)})`);
    
    const allocation = capitalAllocator.allocate(
      signal.symbol, 
      signal.probability, 
      'TRENDING_UP', 
      signal.strategy, 
      1000000 
    );

    try {
      this.activeOrders.add(signal.symbol);
      const res = await fetch('/api/orders/from-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signalIds: [signal.id], 
          portfolioId: 'AUTO_DESK', 
          mode: 'PAPER',
          allocation,
          auditHash: audit.auditRef // Link order to audit hash
        })
      });

      if (res.ok) {
        const update: OrderUpdate = {
          orderid: `AUTO-${Date.now()}`,
          tradingsymbol: signal.symbol,
          status: 'COMPLETE',
          transactiontype: signal.action as any,
          filledqty: allocation.amount / (signal.targets.entry || 1),
          avgprice: signal.targets.entry
        };
        pnlService.onOrderUpdate(update);
        AuditVault.log({ event: 'EXECUTION_FILLED', orderId: update.orderid, symbol: signal.symbol });
      }
    } catch (e) {
      console.error("[AutoExec] Bridge Error", e);
    } finally {
      setTimeout(() => this.activeOrders.delete(signal.symbol), 30000);
    }
  }
}

export const executionEngine = new ExecutionEngine();