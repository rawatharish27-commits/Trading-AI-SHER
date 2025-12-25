import { authenticator } from "otplib";

/**
 * 🔢 TOTP GENERATION NODE
 * Goal: Generate 6-digit TOTP from Base32 secret for SmartAPI handshakes.
 */
export function generateTOTP(secret: string): string {
  if (!secret) return "";
  
  authenticator.options = {
    step: 30,
    digits: 6,
  };

  try {
    return authenticator.generate(secret);
  } catch (e) {
    console.error("🦁 [TOTP] Cryptographic failure:", e);
    return "";
  }
}