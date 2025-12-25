
import { AllocationResult, AccountAllocation } from '../../types';
import { strategyManager } from './strategyManager';
import { pnlService } from './pnlService';
import { governanceService } from './governanceService';

export class CapitalAllocator {
  private readonly BASE_RISK_PER_TRADE = 0.005; // 0.5%
  private readonly MAX_CONCENTRATION_PCT = 0.15; // 15%

  private accounts = [
    { id: 'PRIMARY_HFT', capital: 1000000, riskMultiplier: 1.0, active: true },
    { id: 'BETA_ALGO', capital: 500000, riskMultiplier: 0.7, active: true },
    { id: 'ALPHA_SHARD_01', capital: 2500000, riskMultiplier: 1.2, active: true }
  ];

  allocate(
    symbol: string, 
    probability: number, 
    regime: string, 
    strategyName: string,
    totalAUM: number
  ): AllocationResult {
    const strategyWeight = strategyManager.getWeight(strategyName);
    const isShardingActive = governanceService.isServiceActive('multiAccountSharding');
    
    const regimeMultiplier: Record<string, number> = {
      "TRENDING_UP": 1.0,
      "COMPRESSION": 0.6,
      "RANGING": 0.4,
      "VOLATILE": 0.25,
      "TRENDING_DOWN": 0.8
    };
    
    const envFactor = regimeMultiplier[regime] || 0.5;
    const convictionFactor = probability > 0.85 ? 1.2 : (probability > 0.70 ? 1.0 : 0.5);
    const sessionPnL = pnlService.snapshot().net;
    const drawdownThrottling = sessionPnL < 0 ? Math.max(0.5, 1 + (sessionPnL / totalAUM)) : 1.0;
    
    const finalRiskPct = this.BASE_RISK_PER_TRADE * strategyWeight * envFactor * convictionFactor * drawdownThrottling;

    // If sharding is disabled, concentrate all risk in PRIMARY_HFT
    const activeAccounts = isShardingActive 
        ? this.accounts.filter(a => a.active)
        : [this.accounts[0]];

    const multiAccountAllocs: AccountAllocation[] = activeAccounts.map(acc => {
        const accRiskAmt = acc.capital * finalRiskPct * acc.riskMultiplier;
        const positionSize = (accRiskAmt / 0.015);
        const maxAllowed = acc.capital * this.MAX_CONCENTRATION_PCT;

        return {
          accountId: acc.id,
          amount: Math.round(Math.min(positionSize, maxAllowed) * 100) / 100,
          risk: Math.round(accRiskAmt * 100) / 100
        };
    });

    const totalAlloc = multiAccountAllocs.reduce((sum, a) => sum + a.amount, 0);
    const totalRisk = multiAccountAllocs.reduce((sum, a) => sum + a.risk, 0);

    return {
      symbol,
      amount: totalAlloc,
      risk: totalRisk,
      reason: `${isShardingActive ? 'SHARDED' : 'CONCENTRATED'} | α: x${strategyWeight.toFixed(2)} | Conv: ${(probability*100).toFixed(0)}%`,
      accounts: multiAccountAllocs
    };
  }
}

export const capitalAllocator = new CapitalAllocator();
