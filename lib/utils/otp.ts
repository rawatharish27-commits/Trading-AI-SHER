import CryptoJS from 'crypto-js';

/**
 * 🔢 OTP CRYPTOGRAPHY NODE
 * Generates 6-digit dynamic shards for multi-factor entry.
 */
export const otpUtils = {
  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  hash(otp: string): string {
    return CryptoJS.SHA256(otp).toString();
  }
};
