
import { prisma } from '../prisma';
import { Plan } from '../../types';
import { logAdminAction } from '../utils/adminLogger';
import { hashPassword } from '../utils/password';
import { RiskCore } from './risk/riskCore';

/**
 * 🧑‍💼 INSTITUTIONAL ADMIN SERVICE
 * Command & Control for the Sovereign platform owner.
 * All settings are sharded and persisted in SQL.
 */
export class AdminService {
  /**
   * Commits system-wide parameters to the persistent shard.
   */
  static async updateSystemProfile(adminId: string, settings: any) {
    const updated = await (prisma as any).adminSettings.upsert({
      where: { key: 'GLOBAL_CONFIG' },
      update: { data: JSON.stringify(settings), updatedAt: new Date() },
      create: { key: 'GLOBAL_CONFIG', data: JSON.stringify(settings) }
    });

    await logAdminAction(adminId, 'SYSTEM_PROFILE_COMMIT', settings);
    return updated;
  }

  /**
   * Retrieves persistent system configuration.
   */
  static async getSystemProfile() {
    const config = await (prisma as any).adminSettings.findUnique({
      where: { key: 'GLOBAL_CONFIG' }
    });
    return config ? JSON.parse(config.data) : { riskFloor: 75, maxFirmAUM: 10000000 };
  }

  static async listNodes() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async toggleNodeBlock(userId: string, adminId: string, blocked: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: blocked }
    });

    await logAdminAction(adminId, blocked ? 'IDENTITY_HALTED' : 'IDENTITY_RESTORED', { targetNode: userId });
    return user;
  }

  static async engageGlobalKillSwitch(adminId: string, reason: string) {
    await RiskCore.enableKillSwitch(`ADMIN_REMOTE_ENGAGEMENT: ${reason}`);
    await logAdminAction(adminId, 'GLOBAL_KILL_SWITCH_ENGAGED', { reason });
    return true;
  }

  static async disengageGlobalKillSwitch(adminId: string) {
    await RiskCore.disableKillSwitch();
    await logAdminAction(adminId, 'GLOBAL_KILL_SWITCH_DISENGAGED', {});
    return true;
  }

  static async getAuditTrail() {
    return await prisma.adminActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
