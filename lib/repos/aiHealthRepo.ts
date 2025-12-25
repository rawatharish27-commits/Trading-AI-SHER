
import { prisma } from '../prisma';

/**
 * 🩺 AI HEALTH REPOSITORY
 * Tracks the long-term behavioural health of the neural core.
 */
export const aiHealthRepo = {
  async logMetric(data: {
    noTradeRate: number;
    avgProbability: number;
    avgRegimeConfidence: number;
    lossClusters: number;
    survivalScore: number;
  }) {
    return prisma.aiHealthMetric.create({ data });
  },

  async getTrend(limit = 30) {
    return prisma.aiHealthMetric.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
};
