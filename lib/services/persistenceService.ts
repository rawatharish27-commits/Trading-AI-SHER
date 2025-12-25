import { prisma } from '../prisma';

/**
 * 🧊 NEURAL PERSISTENCE NODE
 * Simulates Redis logic using persistent Database shards.
 * Goal: Survive Cloud Run "Cold Starts" and "Restarts".
 */
export class PersistenceService {
  /**
   * Commits a state shard to the persistent registry.
   */
  static async set(key: string, value: any) {
    return await prisma.riskState.upsert({
      where: { key },
      update: { data: JSON.stringify(value), updatedAt: new Date() },
      create: { key, data: JSON.stringify(value) }
    });
  }

  /**
   * Retrieves a state shard from the persistent registry.
   */
  static async get(key: string): Promise<any | null> {
    const shard = await prisma.riskState.findUnique({ where: { key } });
    return shard ? JSON.parse(shard.data) : null;
  }
}
