
import { AngelOneAdapter, OrderInput } from "../brokers/angelOneAdapter";

export class OrderValidationService {
  /**
   * ✅ MANDATORY PRE-ORDER VALIDATION CHECKLIST
   * Performs deep sanity audit on order parameters to prevent exchange-level rejections.
   */
  static validateLiveOrder(order: Partial<OrderInput>) {
    if (!order.symboltoken) throw new Error("FIREWALL_BLOCK: Instrument token missing.");
    if (!order.tradingsymbol) throw new Error("FIREWALL_BLOCK: Trading symbol missing.");
    if (!["BUY", "SELL"].includes(order.transactiontype || '')) throw new Error("FIREWALL_BLOCK: Invalid side.");
    if (!order.quantity || order.quantity <= 0) throw new Error("FIREWALL_BLOCK: Invalid quantity node.");
    if (!order.price || order.price <= 0) throw new Error("FIREWALL_BLOCK: Invalid price node.");
    if (order.exchange !== "NSE" && order.exchange !== "NFO" && order.exchange !== "BSE") {
        throw new Error("FIREWALL_BLOCK: Exchange segment restricted.");
    }
  }

  /**
   * ✅ INSTITUTIONAL MARGIN VALIDATION
   * Validates capital sufficiency against exchange required margin before dispatch.
   */
  static async validateMargin(adapter: AngelOneAdapter, order: OrderInput): Promise<boolean> {
    try {
      const res = await adapter.getMargin({
        positions: [{
          exchange: order.exchange,
          symboltoken: order.symboltoken,
          qty: order.quantity,
          price: order.price,
          producttype: order.producttype,
          transactiontype: order.transactiontype
        }]
      });

      if (!res.status) return false;
      
      const requiredMargin = parseFloat(res.data.totalmarginrequested);
      const rmsData = await adapter.getRMS();
      const availableCash = parseFloat(rmsData.availablecash);

      if (availableCash < requiredMargin) {
        console.error(`[Firewall] Margin Breach: Needed ₹${requiredMargin} | Available ₹${availableCash}`);
        return false;
      }

      return true;
    } catch (e: any) {
      console.warn("[Firewall] Margin check friction detected. Defaulting to safe rejection.", e.message);
      return false;
    }
  }
}
