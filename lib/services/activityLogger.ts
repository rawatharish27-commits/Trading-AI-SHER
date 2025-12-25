import { prisma } from '../prisma';

/**
 * 📜 ACTIVITY LOGGER NODE
 * Goal: Capture every state-change for institutional transparency.
 */
export class ActivityLogger {
  static async log(userId: string, action: string, metadata: any = {}) {
    console.info(`🦁 [Activity] Node ${userId} triggered: ${action}`);
    
    return await (prisma as any).userActivity.create({
      data: {
        userId,
        action,
        metadata: JSON.stringify(metadata),
        timestamp: new Date()
      }
    });
  }
}
