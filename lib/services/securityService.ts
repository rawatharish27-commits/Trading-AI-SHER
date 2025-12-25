import { UserProfile } from '../../types';
import { prisma } from '../prisma';
import { verifyPassword, hashPassword } from '../utils/password';
import { jwtUtils } from '../utils/jwt';
import { otpUtils } from '../utils/otp';
import { smsService } from './smsService';

class SecurityService {
  /**
   * 🛡️ ADMIN LOGIN STEP 1: PASSWORD CHALLENGE
   */
  async initiateAdminLogin(userId: string, pass: string): Promise<{ adminId: string } | null> {
    const admin = await prisma.admin.findUnique({ where: { userId: userId.toUpperCase() } });
    if (!admin) return null;

    const isValid = await verifyPassword(pass, admin.passwordHash);
    if (!isValid) return null;

    const otp = otpUtils.generate();
    const otpHash = otpUtils.hash(otp);
    
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        otpHash,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    await smsService.sendOTP(admin.mobile, otp);
    return { adminId: admin.id };
  }

  /**
   * 🛡️ ADMIN LOGIN STEP 2: OTP VERIFICATION
   */
  async verifyAdminOTP(adminId: string, otp: string): Promise<{ profile: UserProfile, accessToken: string, refreshToken: string } | null> {
    const admin = await (prisma as any).admin.findUnique({ where: { id: adminId } });
    if (!admin || !admin.otpHash) return null;

    if (new Date() > new Date(admin.otpExpiresAt)) {
        console.error("🦁 [Security] Shard Key Expired.");
        return null;
    }

    if (otpUtils.hash(otp) !== admin.otpHash) return null;

    // Nuclear Reset: Wipe OTP after use
    await prisma.admin.update({
      where: { id: adminId },
      data: { otpHash: null, otpExpiresAt: null }
    });

    const accessToken = jwtUtils.sign({ id: admin.id, role: 'ADMIN' }, '15m');
    const refreshToken = jwtUtils.sign({ id: admin.id }, '14d');

    // Map Admin to UserProfile shape for UI
    const profile: any = {
        id: admin.id,
        userId: admin.userId,
        email: admin.email,
        role: 'ADMIN',
        plan: 'INSTITUTIONAL',
        securityAudit: { lastPasswordChange: new Date().toISOString(), mfaVerified: true, identityVerified: true }
    };

    return { profile, accessToken, refreshToken };
  }

  /**
   * 🛡️ STANDARD USER LOGIN (Hardened for Phase 7)
   */
  async login(userId: string, pass: string): Promise<{ profile: UserProfile, accessToken: string, refreshToken: string } | null> {
    const user = await prisma.user.findUnique({ where: { userId: userId.toLowerCase() } });
    if (!user) return null;

    // 🚀 ENFORCEMENT: Blocked identities are denied access
    if (user.isBlocked) {
       console.warn(`🦁 [Security] Access Refused: Node ${userId} is currently quarantined.`);
       return null;
    }

    const isValid = await verifyPassword(pass, user.passwordHash || '');
    if (!isValid) return null;

    const accessToken = jwtUtils.sign({ id: user.id, role: 'TRADER' }, '15m');
    const refreshToken = jwtUtils.sign({ id: user.id }, '14d');

    return { profile: user as any, accessToken, refreshToken };
  }

  async registerUser(profile: any) {
    const passwordHash = await hashPassword(profile.password || '');
    const { password, ...data } = profile;
    await prisma.user.create({ data: { ...data, passwordHash, isBlocked: false } });
  }

  getAllUsers(): UserProfile[] {
    return (prisma as any).memoryDB.users;
  }

  isUserIdTaken(userId: string): boolean {
    const taken = (prisma as any).memoryDB.users.some((u: any) => u.userId === userId.toLowerCase());
    return taken;
  }

  async dispatchHandshake(email: string, mobile: string): Promise<boolean> {
    const otp = otpUtils.generate();
    return await smsService.sendOTP(mobile, otp);
  }

  commitUpdate(userId: string, data: any): boolean {
    return true;
  }
}

export const securityService = new SecurityService();
