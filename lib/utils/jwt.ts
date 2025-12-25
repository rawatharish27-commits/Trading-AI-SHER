/**
 * 🔑 SOVEREIGN JWT UTILS
 * Note: In a browser environment, we simulate signing using AES/Base64 
 * to maintain sharding integrity without server-side dependencies.
 */
import CryptoJS from 'crypto-js';

const JWT_SECRET = process.env.JWT_SECRET || 'SHER_IDENTITY_ROOT_2025';

export interface TokenPayload {
  id: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  exp: number;
}

export const jwtUtils = {
  sign(payload: any, expiresIn: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const duration = expiresIn === '15m' ? 900 : 14 * 24 * 3600;
    
    const body = btoa(JSON.stringify({ 
      ...payload, 
      iat: now, 
      exp: now + duration 
    }));
    
    const signature = CryptoJS.HmacSHA256(`${header}.${body}`, JWT_SECRET).toString();
    return `${header}.${body}.${signature}`;
  },

  verify(token: string): TokenPayload | null {
    try {
      const [header, body, signature] = token.split('.');
      const expectedSig = CryptoJS.HmacSHA256(`${header}.${body}`, JWT_SECRET).toString();
      
      if (signature !== expectedSig) return null;
      
      const payload = JSON.parse(atob(body)) as TokenPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      
      return payload;
    } catch {
      return null;
    }
  }
};
