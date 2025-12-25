
import { prisma } from "../prisma";

/**
 * 🦁 STRICT SYMBOL RESOLVER
 * Architecture: SQL Shard Only. No API fallback.
 */
export class SymbolResolver {
  static async resolve(symbol: string, exchange: string = 'NSE'): Promise<{ tradingsymbol: string; token: string }> {
    const cleanSymbol = symbol.toUpperCase().trim();
    
    const instrument = await prisma.instrumentMaster.findFirst({
      where: {
        OR: [
          { symbol: cleanSymbol },
          { symbol: `${cleanSymbol}-EQ` }
        ],
        exch_seg: exchange
      }
    });

    if (!instrument) {
      throw new Error(`SYMBOL_NOT_FOUND: ${cleanSymbol} on ${exchange}`);
    }

    return {
      tradingsymbol: instrument.symbol,
      token: instrument.token
    };
  }
}
