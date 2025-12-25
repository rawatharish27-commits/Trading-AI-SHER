import axios from 'axios';
import { prisma } from '../prisma';
import { generateTOTP } from '../brokers/totp';

const BASE_URL = "https://apiconnect.angelone.in/rest";

/**
 * 🛰️ ANGEL AUTHENTICATION NODE
 * Primary responsibility: Exchange credentials for institutional session shards.
 */
export class AngelAuthService {
  static async performInstitutionalLogin(): Promise<string> {
    const apiKey = process.env.ANGEL_ONE_API_KEY || process.env.ANGEL_API_KEY;
    const clientCode = process.env.ANGEL_ONE_CLIENT_ID || process.env.ANGEL_CLIENT_CODE;
    const mpin = process.env.ANGEL_ONE_PASSWORD || process.env.ANGEL_MPIN;
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET || process.env.ANGEL_TOTP_SECRET;

    if (!apiKey || !clientCode || !mpin || !totpSecret) {
      throw new Error("🦁 [AngelAuth] CRITICAL: Institutional credentials missing from environment.");
    }

    const totp = generateTOTP(totpSecret);

    try {
      const response = await axios.post(
        `${BASE_URL}/auth/angelbroking/user/v1/loginByPassword`,
        { clientcode: clientCode, password: mpin, totp },
        {
          headers: {
            "X-UserType": "USER",
            "X-SourceID": "WEB",
            "X-ClientLocalIP": "127.0.0.1",
            "X-ClientPublicIP": "127.0.0.1",
            "X-MACAddress": "00:00:00:00:00:00",
            "X-PrivateKey": apiKey
          }
        }
      );

      const body = response.data;
      if (!body.status || !body.data) {
        throw new Error(body.message || "Exchange Refused Handshake.");
      }

      const { jwtToken, refreshToken, feedToken } = body.data;

      // 🏛️ ATOMIC PERSISTENCE: Wipe old sessions, commit new shard
      await (prisma as any).angelSession.deleteMany();
      await (prisma as any).angelSession.create({
        data: {
          accessToken: jwtToken,
          refreshToken: refreshToken,
          feedToken: feedToken,
          expiresAt: new Date(Date.now() + 20 * 60 * 1000) // 20 Min TTL for safety
        }
      });

      console.info("🦁 [AngelAuth] Institutional Session Shard provisioned.");
      return jwtToken;
    } catch (err: any) {
      console.error("🦁 [AngelAuth] Handshake Failed:", err.response?.data?.message || err.message);
      throw err;
    }
  }
}