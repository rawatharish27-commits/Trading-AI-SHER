import axios from 'axios';
import { AngelTokenManager } from './angelTokenManager';

const BASE_URL = "https://apiconnect.angelone.in/rest";

/**
 * 📡 ANGEL API SERVICE (Stateless)
 * Goal: Abstract request logic and handle 401 session recovery.
 */
export class AngelApiService {
  static async request(endpoint: string, data: any = {}, method: 'POST' | 'GET' = 'POST') {
    const apiKey = process.env.ANGEL_ONE_API_KEY || process.env.ANGEL_API_KEY;
    
    const execute = async () => {
      const token = await AngelTokenManager.getValidToken();
      return await axios({
        url: `${BASE_URL}${endpoint}`,
        method,
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-PrivateKey": apiKey!,
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
    };

    try {
      return await execute();
    } catch (err: any) {
      // 🔄 AUTOMATIC RECOVERY: If 401 (Unauthorized), shard likely expired early
      if (err.response?.status === 401) {
        console.warn("🦁 [AngelAPI] Shard 401 detected. Forcing node refresh...");
        // Re-executing will trigger getValidToken which handles fresh login
        return await execute();
      }
      throw err;
    }
  }
}