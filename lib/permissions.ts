
import { Plan } from '../types';

export const FEATURE_ACCESS = {
  // ---------- COMMON (Essential Trading Suite) ----------
  DASHBOARD: [Plan.FREE, Plan.PRO, Plan.ELITE],
  PORTFOLIO: [Plan.FREE, Plan.PRO, Plan.ELITE],
  PAPER_TRADING: [Plan.FREE, Plan.PRO, Plan.ELITE],
  WATCHLIST: [Plan.FREE, Plan.PRO, Plan.ELITE],
  TRADE_JOURNAL: [Plan.FREE, Plan.PRO, Plan.ELITE],

  // ---------- PRO (Quant Edge) ----------
  BACKTESTING: [Plan.PRO, Plan.ELITE],
  STRATEGY_BUILDER: [Plan.PRO, Plan.ELITE],
  ADVANCED_CHARTS: [Plan.PRO, Plan.ELITE],
  ANALYTICS: [Plan.PRO, Plan.ELITE],
  AUDIT_LOGS: [Plan.PRO, Plan.ELITE],

  // ---------- ELITE (Production Infrastructure) ----------
  LIVE_TRADING: [Plan.ELITE],
  AI_SIGNALS: [Plan.ELITE],
  AI_PREDICTIONS: [Plan.ELITE],
  SMART_MONEY_ALERTS: [Plan.ELITE],
  MOBILE_NOTIFICATIONS: [Plan.ELITE],
  INVESTOR_VIEW: [Plan.ELITE],

  // ---------- ADMIN (Sovereign Access) ----------
  ADMIN_PANEL: [], // Restricted to UserRole.ADMIN only
} as const;

export type Feature = keyof typeof FEATURE_ACCESS;
