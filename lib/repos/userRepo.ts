
import { prisma } from '../prisma';
import { UserProfile } from '../../types';

/**
 * 🔐 USER REPOSITORY (SOVEREIGN ACCESS)
 * Single source of truth for Identity Nodes.
 */
export const userRepo = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  async create(data: Partial<UserProfile>) {
    return prisma.user.create({ data });
  },

  async updateMFA(userId: string, enabled: boolean) {
    // Audit rule: MFA change is a high-severity event
    return prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: enabled }
    });
  }
};
