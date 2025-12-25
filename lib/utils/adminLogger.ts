import { prisma } from '../prisma';

/**
 * 📜 ADMIN AUDIT LOGGER
 * Goal: Immutable record of every administrative sharding event.
 */
export async function logAdminAction(adminId: string, action: string, metadata: any = {}) {
  console.info(`🏛️ [Governance] Admin ${adminId} triggered: ${action}`);
  
  return await prisma.adminActivity.create({
    data: {
      adminId,
      action,
      metadata: JSON.stringify(metadata),
      createdAt: new Date()
    }
  });
}
