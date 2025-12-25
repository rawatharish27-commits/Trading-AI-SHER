import { PortfolioItem, PnLSnapshot, OrderUpdate, AssetClass } from "../../types";
import { LearningBrain } from "../learning/LearningBrain";

class PnLService {
  private positions: Map<string, PortfolioItem> = new Map();
  private realizedPnL = 0;
  private unrealizedPnL = 0;

  onPriceTick(symbol: string, ltp: number) {
    const cleanSymbol = symbol.split('-')[0].replace(/\s/g, '').toUpperCase();
    const pos = this.positions.get(cleanSymbol);
    
    if (!pos) return;

    const currentPnl = (ltp - pos.avgPrice) * pos.quantity;
    pos.currentPrice = ltp;
    pos.pnl = currentPnl;
    pos.unrealized = currentPnl;
    pos.pnlPercent = (currentPnl / (pos.avgPrice * pos.quantity)) * 100;

    this.recalculate();
  }

  private processFill(tradingsymbol: string, side: 'BUY' | 'SELL', qty: number, price: number, orderid: string) {
    const symbol = tradingsymbol.split('-')[0].toUpperCase();
    const existing = this.positions.get(symbol);

    if (existing) {
      if (side === 'SELL') {
        const tradePnL = (price - existing.avgPrice) * qty;
        this.realizedPnL += tradePnL;
        
        // --- PHASE 4: LEARNING TRIGGER ---
        LearningBrain.ingestOutcome({
          id: orderid,
          symbol,
          timestamp: Date.now(),
          regime: 'TREND', // Simplified for prototype
          strategyId: 'active-ensemble',
          predictedProb: 0.85, 
          actualOutcome: tradePnL > 0 ? 'PROFIT' : 'LOSS',
          pnlPoints: tradePnL,
          mistakeTags: [],
          contextSnapshot: { price, qty }
        });

        existing.quantity -= qty;
        if (existing.quantity <= 0) this.positions.delete(symbol);
      } else {
        const newQty = existing.quantity + qty;
        const newAvg = ((existing.avgPrice * existing.quantity) + (price * qty)) / newQty;
        existing.quantity = newQty;
        existing.avgPrice = newAvg;
      }
    } else if (side === 'BUY') {
      this.positions.set(symbol, {
        id: orderid,
        symbol,
        assetClass: AssetClass.EQUITY,
        quantity: qty,
        avgPrice: price,
        currentPrice: price,
        pnl: 0,
        pnlPercent: 0,
        unrealized: 0
      });
    }
    this.recalculate();
  }

  onOrderUpdate(update: OrderUpdate) {
    this.processFill(update.tradingsymbol, update.transactiontype, update.filledqty, update.avgprice, update.orderid);
  }

  onPostbackUpdate(payload: any) {
    if (payload.orderstatus === 'complete' || payload.orderstatus === 'executed') {
        this.processFill(
          payload.tradingsymbol,
          payload.transactiontype,
          parseInt(payload.filledshares || payload.quantity),
          parseFloat(payload.averageprice || payload.price),
          payload.orderid
        );
    }
  }

  private recalculate() {
    let totalUnrealized = 0;
    this.positions.forEach(p => totalUnrealized += (p.unrealized || 0));
    this.unrealizedPnL = totalUnrealized;
  }

  snapshot(): PnLSnapshot {
    return {
      realized: this.realizedPnL,
      unrealized: this.unrealizedPnL,
      net: this.realizedPnL + this.unrealizedPnL,
      timestamp: new Date().toISOString()
    };
  }

  getPositions(): PortfolioItem[] {
    return Array.from(this.positions.values());
  }
}

export const pnlService = new PnLService();