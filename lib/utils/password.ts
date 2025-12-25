import bcrypt from 'bcryptjs';

/**
 * 🔐 PASSWORD SECURITY NODE
 * Rule: 12 rounds of entropy for production-grade hashing.
 */
export async function hashPassword(password: string): Promise<string> {
  // We use bcryptjs for universal runtime compatibility
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
