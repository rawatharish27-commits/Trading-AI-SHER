/**
 * 🛰️ API CONFIGURATION NODE
 * Manages the connection between Vercel (Frontend) and GCP (Backend).
 */
export const API_CONFIG = {
  // Use env var for production, fallback to relative for same-host deployment
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  
  ENDPOINTS: {
    HEALTH: '/api/health',
    AUTH: '/api/auth',
    BROKER: '/api/broker',
    SIGNALS: '/api/agent/analyze-symbol',
    PNL: '/api/pnl',
    REPORTS: '/api/reports/daily'
  },

  getAbsoluteUrl(endpoint: string): string {
    if (!this.BASE_URL) return endpoint;
    return `${this.BASE_URL}${endpoint}`;
  }
};
