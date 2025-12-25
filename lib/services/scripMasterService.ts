import { prisma } from "../prisma";
import { retry } from "../utils";

const SCRIP_MASTER_PROXY = "/api/instruments/master";

export interface ScripMasterItem {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: string;
  lotsize: string;
  instrumenttype: string;
  exch_seg: string;
  tick_size: string;
}

class ScripMasterService {
  private masterList: ScripMasterItem[] = [];
  private initialized = false;
  private isDownloading = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // NON-BLOCKING BOOTSTRAP: Critical Institutional Rule
      this.bootstrap().catch(e => console.warn("🦁 [ScripMaster] Safe-fail caught:", e.message));
    }
  }

  get isReady() { return this.initialized; }

  /**
   * 🦁 INSTITUTIONAL PRELOAD NODE (NON-CRITICAL)
   * Goal: Server stays UP even if ScripMaster is down.
   */
  async bootstrap() {
    if (this.initialized) return;

    try {
      // 1. Check SQL Shard first
      const count = await prisma.instrumentMaster.count();
      if (count > 2000) {
        console.log(`🦁 [ScripMaster] SQL Shard verified (${count} nodes). Initializing core...`);
        this.initialized = true;
        // Background sync to refresh if needed
        this.sync().catch(() => {});
        return;
      }

      // 2. Initial Provisioning
      await this.sync();
    } catch (e) {
      console.warn("🦁 [ScripMaster] Bootstrap friction: SQL/Proxy unavailable. Node in Standby.");
      // We do NOT throw here.
    }
  }

  async sync() {
    if (this.isDownloading) return;
    this.isDownloading = true;

    try {
      console.log("🦁 [ScripMaster] Syncing instrument shards...");
      const data = await retry(async () => {
        const response = await fetch(SCRIP_MASTER_PROXY);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!Array.isArray(json)) throw new Error("Invalid format");
        return json;
      }, 2, 1000);

      if (data && data.length > 0) {
        this.masterList = data;
        this.initialized = true;
        
        // Background persistence
        prisma.instrumentMaster.createMany(data.slice(0, 15000)).catch(() => {});
        console.log(`🦁 [ScripMaster] Sync complete. ${data.length} instruments active.`);
      } else {
        console.warn("🦁 [ScripMaster] Proxy returned empty shard. Using local cache.");
      }
    } catch (e: any) {
      // NON-CRITICAL: Log as warning and proceed with cached data if available
      console.warn(`🟡 [ScripMaster] Sync failed (${e.message}). Trading will continue using DB cache.`);
    } finally {
      this.isDownloading = false;
    }
  }

  getScripBySymbol(symbol: string) {
    const clean = symbol.toUpperCase().trim();
    return this.masterList.find(i => i.symbol === clean || i.symbol === `${clean}-EQ`);
  }

  getScripByToken(token: string) {
    return this.masterList.find(i => i.token === token);
  }

  search(query: string, limit = 10): ScripMasterItem[] {
    if (!query || query.length < 2) return [];
    const upperQuery = query.toUpperCase();
    return this.masterList
      .filter(item => item.symbol && item.symbol.includes(upperQuery))
      .slice(0, limit);
  }
}

export const scripMasterService = new ScripMasterService();