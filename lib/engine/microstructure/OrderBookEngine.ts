export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export class OrderBookEngine {
  /**
   * 📊 ORDER BOOK IMBALANCE (OBI)
   * Formula: (BidQty - AskQty) / (BidQty + AskQty)
   * Range: -1 (Sell Pressure) to +1 (Buy Pressure)
   */
  static calculateImbalance(book: OrderBook): number {
    const bidQty = book.bids.reduce((s, b) => s + b.qty, 0);
    const askQty = book.asks.reduce((s, a) => s + a.qty, 0);
    const total = bidQty + askQty;
    if (total === 0) return 0;
    return (bidQty - askQty) / total;
  }

  /**
   * 🧱 LIQUIDITY WALL DETECTION
   */
  static detectWalls(book: OrderBook) {
    const avgBidQty = book.bids.reduce((s, b) => s + b.qty, 0) / (book.bids.length || 1);
    const avgAskQty = book.asks.reduce((s, a) => s + a.qty, 0) / (book.asks.length || 1);

    return {
      bidWall: book.bids.find(b => b.qty > avgBidQty * 5),
      askWall: book.asks.find(a => a.qty > avgAskQty * 5)
    };
  }

  static getMicroBias(book: OrderBook) {
    const imbalance = this.calculateImbalance(book);
    const strength = Math.abs(imbalance);
    
    if (strength > 0.6) {
        return {
            bias: imbalance > 0 ? 'BUY' : 'SELL',
            strength
        };
    }
    return null;
  }
}