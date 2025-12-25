import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/utils/password';

/**
 * 🏛️ SUPER ADMIN PROVISIONING NODE
 * Command: npx ts-node scripts/createSuperAdmin.ts
 * Use this script exactly ONCE during initial deployment.
 */
async function main() {
  console.log("🦁 [Provisioner] Checking Admin Registry...");
  
  const exists = await prisma.admin.findFirst();
  if (exists) {
    console.warn("⚠️ [Provisioner] Admin already exists in shard. Skipping duplicate creation.");
    return;
  }

  const email = process.env.ADMIN_EMAIL || "admin@sher.ai";
  const mobile = process.env.ADMIN_MOBILE || "9999999999";
  const password = process.env.ADMIN_PASSWORD || "CHANGE_ME_NOW";

  await prisma.admin.create({
    data: {
      userId: "MASTER_NODE_ROOT",
      email: email,
      mobile: mobile,
      passwordHash: await hashPassword(password),
      twoFAEnabled: false,
      recoveryEmail: "recovery@sher.ai"
    }
  });

  console.log("✅ [Provisioner] Super Admin provisioned successfully.");
  console.log(`   - Email: ${email}`);
  console.log(`   - ID: MASTER_NODE_ROOT`);
  console.log("⚠️ [Provisioner] REMOVE temporary passwords from environment secrets.");
}

main().catch(err => {
  console.error("❌ [Provisioner] Critical Failure:", err.message);
  // Fix: Casting process to any to access exit() which may not be in the base Process type in some environments.
  (process as any).exit(1);
});