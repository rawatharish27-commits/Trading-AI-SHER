
import { prisma } from '../prisma';

/**
 * 🛡️ RISK REPOSITORY
 * Captures immutable snapshots of capital utilization and drawdown.
 */
export const riskRepo = {
  async captureSnapshot(data: {
    capitalUsedPct: number;
    drawdownPct: number;
    lossClusterActive: boolean;
    killSwitch: boolean;
  }) {
    return prisma.riskState.create({ data });
  },

  async getLatest() {
    const states = await prisma.riskState.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    return states[0] || null;
  }
};
