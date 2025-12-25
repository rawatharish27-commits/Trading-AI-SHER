
import { BrokerConfig } from '../../types';
import CryptoJS from 'crypto-js';

class BrokerConfigService {
  private readonly STORAGE_KEY = 'sher_broker_vault_secure_v2';
  private readonly VAULT_SALT = 'sher-institutional-vault-2024-k9x-alpha';

  /**
   * Retrieves broker configuration.
   * Priority: Environment Variables (Sovereign Mode) > Encrypted Vault (User Mode).
   */
  getConfig(): BrokerConfig {
    // 1. Check for Server-Side Environment Variables (Injected via process.env)
    const envApiKey = process.env.ANGEL_ONE_API_KEY;
    const envClientId = process.env.ANGEL_ONE_CLIENT_ID;
    const envPass = process.env.ANGEL_ONE_PASSWORD;
    const envTotp = process.env.ANGEL_ONE_TOTP_SECRET;

    if (envApiKey && envClientId) {
      console.info("🦁 [BrokerConfig] Initializing in Sovereign Node Mode (Env Vars Active)");
      return {
        brokerName: 'ANGEL_ONE',
        apiKey: envApiKey,
        clientId: envClientId,
        password: envPass || '',
        totpSecret: envTotp || '',
        isConnected: true
      };
    }

    // 2. Fallback to Encrypted Vault in LocalStorage
    const encrypted = typeof window !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
    
    if (encrypted) {
      try {
        const bytes = CryptoJS.AES.decrypt(encrypted, this.VAULT_SALT);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          return JSON.parse(decryptedStr);
        }
      } catch (e) {
        console.error("Vault Decryption Failure: Credentials may be corrupted.", e);
      }
    }

    return {
      brokerName: 'ANGEL_ONE',
      apiKey: '',
      clientId: '',
      password: '',
      totpSecret: '',
      isConnected: false
    };
  }

  saveConfig(config: BrokerConfig) {
    if (typeof window === 'undefined') return;
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(config), this.VAULT_SALT).toString();
      localStorage.setItem(this.STORAGE_KEY, encrypted);
    } catch (e) {
      console.error("Vault Encryption Failure", e);
    }
  }

  clearVault() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  calculateEntropy(secret: string): number {
    if (!secret) return 0;
    const length = secret.length;
    const uniqueChars = new Set(secret).size;
    return (uniqueChars / length) * 100;
  }
}

export const brokerConfigService = new BrokerConfigService();
