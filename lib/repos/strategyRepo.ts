
import { prisma } from '../prisma';
import { StrategyStatus } from '../../types';

/**
 * 🧠 STRATEGY REPOSITORY
 * Manages the certification and decay state of logic shards.
 */
export const strategyRepo = {
  async certify(name: string, regime: string) {
    return prisma.strategy.create({
      data: {
        name,
        status: 'CERTIFIED',
        validRegime: regime
      }
    });
  },

  async listAll() {
    return prisma.strategy.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async updateStatus(id: string, status: 'CERTIFIED' | 'DECAYING' | 'RETIRED') {
    return prisma.strategy.update({
      where: { id },
      data: { status }
    });
  }
};
