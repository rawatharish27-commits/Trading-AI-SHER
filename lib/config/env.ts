
import { z } from "zod";

/**
 * 🛡️ SOVEREIGN ENV PROTOCOL (v4.6)
 * Goal: Hard-fail if institutional secrets are compromised or missing.
 */
export const EnvSchema = z.object({
  // Mandatory Neural Core
  API_KEY: z.string().min(1, "NEURAL_SHARD_MISSING"),
  
  // Persistence & Settlement
  DATABASE_URL: z.string().min(1, "PERSISTENCE_SHARD_MISSING"),
  
  // Broker Infrastructure
  ANGEL_ONE_API_KEY: z.string().min(1, "BROKER_KEY_MISSING"),
  ANGEL_ONE_CLIENT_ID: z.string().min(1, "CLIENT_ID_MISSING"),
  ANGEL_ONE_PASSWORD: z.string().min(1, "VAULT_PIN_MISSING"),
  ANGEL_ONE_TOTP_SECRET: z.string().min(1, "MFA_SHARD_MISSING"),
  
  // Operational Mode
  MARKET_MODE: z.enum(["PAPER", "LIVE"]).default("PAPER"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("8080"),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(): boolean {
  if (typeof window !== 'undefined') return true;

  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error("🦁 [EnvGuard] CRITICAL BOOT FAILURE: LOGIC SHARDS MISSING");
    console.table(result.error.flatten().fieldErrors);
    
    if (process.env.NODE_ENV === 'production') {
      console.error("🦁 [EnvGuard] Termination Protocol: HALT.");
      // We do not call process.exit directly to avoid browser env crashes, 
      // but return false to stop initializeNode()
    }
    return false;
  }

  console.log("%c 🦁 [EnvGuard] Institutional Integrity Verified.", "color: #10b981; font-weight: bold;");
  return true;
}

export const env = EnvSchema.parse(process.env || {});
