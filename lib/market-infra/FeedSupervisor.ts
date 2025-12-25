import { AngelOneStream, ExchangeType, SubscriptionMode } from "../brokers/angelOneStream";
import { TickStateStore } from "./TickStateStore";
import { FeedHealthMonitor } from "../ops/FeedHealthMonitor";

/**
 * 👮 FEED SUPERVISOR
 * Isolation layer between Application Logic and raw Network Sockets.
 */
export class FeedSupervisor {
  private streams: Map<string, AngelOneStream> = new Map();
  private retryPolicy = { maxAttempts: 5, backoff: 2000 };

  async manageShard(id: string, config: any, tokens: string[]) {
    if (this.streams.has(id)) {
      this.streams.get(id)?.disconnect();
    }

    const stream = new AngelOneStream(config, (packet) => {
      // 1. Storage Node
      TickStateStore.update(packet);
      
      // 2. Metrics Node
      FeedHealthMonitor.recordTick();
    });

    stream.connect();
    
    // Safety delay for handshake
    setTimeout(() => {
      stream.subscribe(ExchangeType.NSE_CM, tokens, SubscriptionMode.QUOTE);
    }, 1500);

    this.streams.set(id, stream);
    console.log(`🦁 [Supervisor] Shard ${id} provisioned with ${tokens.length} assets.`);
  }

  shutdown() {
    this.streams.forEach(s => s.disconnect());
    this.streams.clear();
  }
}

export const feedSupervisor = new FeedSupervisor();