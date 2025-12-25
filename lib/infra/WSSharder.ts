/**
 * 🛰️ WS SHARDER
 * Goal: Prevent single-socket bottlenecks by sharding symbols.
 */
export class WSSharder {
  private static readonly SYMBOLS_PER_SHARD = 50;
  private shards: Map<string, string[]> = new Map();

  /**
   * Assigns a symbol to a specific shard ID.
   * Ensures deterministic routing based on symbol hash.
   */
  static getShardId(symbol: string): string {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash << 5) - hash + symbol.charCodeAt(i);
      hash |= 0; 
    }
    return `SHARD_${Math.abs(hash % 4)}`; // 4 Virtual nodes
  }

  static shardSymbols(symbols: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    symbols.forEach(s => {
      const id = this.getShardId(s);
      if (!result[id]) result[id] = [];
      result[id].push(s);
    });
    return result;
  }
}