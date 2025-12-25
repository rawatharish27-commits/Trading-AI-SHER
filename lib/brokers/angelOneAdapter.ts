import { AngelApiService } from "../services/angelApiService";
import { AngelTokenManager } from "../services/angelTokenManager";

export interface OrderInput {
  variety: "NORMAL" | "STOPLOSS" | "AMO" | "ROBO";
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: "BUY" | "SELL";
  exchange: "NSE" | "BSE" | "NFO" | "MCX";
  ordertype: "MARKET" | "LIMIT" | "STOPLOSS_LIMIT" | "STOPLOSS_MARKET";
  producttype: "DELIVERY" | "CARRYOVER" | "MARGIN" | "INTRADAY" | "BO";
  duration: "DAY" | "IOC";
  price: number;
  quantity: number;
}

export interface HistoricalParams {
  exchange: string;
  symboltoken: string;
  interval: string;
  fromdate: string;
  todate: string;
}

/**
 * 🔌 ANGEL ONE ADAPTER (Production Stabilized)
 * Goal: Zero-Downtime Session Management.
 * Survives container restarts via DB-sharded token lifecycle.
 */
export class AngelOneAdapter {
  // Added constructor to resolve "Expected 0 arguments, but got 1" errors at multiple call sites.
  constructor(_config?: any) {}

  async login() {
    const jwt = await AngelTokenManager.getValidToken();
    const feed = await AngelTokenManager.getFeedToken();
    return { jwt, feed };
  }

  async getMargin(params: any) {
    const res = await AngelApiService.request("/secure/angelbroking/margin/v1/batch", params);
    return res.data;
  }

  async placeOrder(params: OrderInput) {
    const res = await AngelApiService.request("/secure/angelbroking/order/v1/placeOrder", params);
    if (!res.data.status) throw new Error(res.data.message || "Exchange Rejected Order Shard");
    return res.data.data;
  }

  async getRMS() {
    const res = await AngelApiService.request("/secure/angelbroking/user/v1/getRMS", {}, 'GET');
    if (!res.data.status) throw new Error("RMS Node Unreachable");
    return res.data.data;
  }

  async getProfile() {
    const res = await AngelApiService.request("/secure/angelbroking/user/v1/getProfile", {}, 'GET');
    return res.data.data;
  }

  async getHistoricalCandles(params: HistoricalParams) {
    const res = await AngelApiService.request("/secure/angelbroking/historical/v1/getCandleData", params);
    return res.data.data;
  }

  // Added getHistoricalOI method to resolve "Property 'getHistoricalOI' does not exist on type 'AngelOneAdapter'" error in historical route.
  async getHistoricalOI(params: HistoricalParams) {
    const res = await AngelApiService.request("/secure/angelbroking/historical/v1/getOIData", params);
    return res.data.data;
  }

  async getOrderBook() {
    const res = await AngelApiService.request("/secure/angelbroking/order/v1/getOrderBook", {}, 'GET');
    return res.data.data;
  }

  async getTradeBook() {
    const res = await AngelApiService.request("/secure/angelbroking/order/v1/getTradeBook", {}, 'GET');
    return res.data.data;
  }

  async getAllHolding() {
    const res = await AngelApiService.request("/secure/angelbroking/portfolio/v1/getHolding", {}, 'GET');
    return res.data.data;
  }

  async getPosition() {
    const res = await AngelApiService.request("/secure/angelbroking/portfolio/v1/getPosition", {}, 'GET');
    return res.data.data;
  }

  async convertPosition(params: any) {
    const res = await AngelApiService.request("/secure/angelbroking/portfolio/v1/convertPosition", params);
    return res.data.data;
  }

  async getMarketData(params: { mode: string; exchangeTokens: any }) {
    const res = await AngelApiService.request("/secure/angelbroking/market/v1/quote", params);
    return res.data.data;
  }

  async logout() {
    const clientCode = process.env.ANGEL_ONE_CLIENT_ID || process.env.ANGEL_CLIENT_CODE;
    await AngelApiService.request("/auth/angelbroking/user/v1/logout", { clientcode: clientCode });
  }
}