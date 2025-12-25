/**
 * 🛡️ ENV PROTECTOR (HARD-FAIL PROTOCOL v2)
 * Ensures the node doesn't start in a compromised or partial state.
 */
const REQUIRED_ENV = {
  API_KEY: "Google Gemini Neural Shard",
  DATABASE_URL: "Persistent SQL Registry",
  ANGEL_ONE_API_KEY: "Broker API Key",
  ANGEL_ONE_CLIENT_ID: "Institutional Client ID",
  ANGEL_ONE_PASSWORD: "Vault Access PIN",
  ANGEL_ONE_TOTP_SECRET: "MFA Shard Key",
};

export function validateEnvironment() {
  if (typeof window !== 'undefined') return true;

  const missing = Object.entries(REQUIRED_ENV).filter(([key]) => !process.env[key]);

  if (missing.length > 0) {
    console.error("%c ❌ CRITICAL BOOT FAILURE: LOGIC SHARDS MISSING", "color: #ff4b4b; font-weight: 900; font-size: 16px;");
    missing.forEach(([key, desc]) => {
      console.error(`   - ${key.padEnd(20)} | Missing: ${desc}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      console.error("🦁 [EnvGuard] Execution Halted for Institutional Safety.");
      (process as any).exit?.(1);
    }
    return false;
  }
  
  console.log("%c 🦁 [EnvGuard] Institutional Credentials Verified. Node Stable.", "color: #10b981; font-weight: bold;");
  return true;
}

export const getMarketMode = () => (process.env.NEXT_PUBLIC_MARKET_MODE || 'PAPER') as 'PAPER' | 'LIVE';