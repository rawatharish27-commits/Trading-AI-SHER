import { tokenManager } from "../services/tokenManager";
import { brokerConfigService } from "../services/brokerConfigService";
import { feedSupervisor } from "../market-infra/FeedSupervisor";
import { DecodedTick } from "../brokers/decoder";

class MarketFeedCoordinator {
  private tickListeners: Set<(tick: DecodedTick) => void> = new Set();
  private readonly SHARD_LIMIT = 50;

  async synchronize(symbols: { token: string; exchange: number }[]) {
    const config = brokerConfigService.getConfig();
    const jwt = tokenManager.getJWT();
    const feed = tokenManager.getFeedToken();

    if (!jwt || !feed || !config.apiKey) return;

    const chunks = this.chunkArray(symbols, this.SHARD_LIMIT);

    chunks.forEach((chunk, index) => {
      feedSupervisor.manageShard(`SHARD_${index}`, {
        clientCode: config.clientId,
        feedToken: feed,
        apiKey: config.apiKey
      }, chunk.map(s => s.token));
    });
  }

  private chunkArray(arr: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  onTick(callback: (tick: DecodedTick) => void) {
    // Note: In new infra, components should consume from TickStateStore
    // This is for legacy support in existing hooks
    this.tickListeners.add(callback);
    return () => this.tickListeners.delete(callback);
  }

  terminateAll() {
    feedSupervisor.shutdown();
  }
}

export const marketFeedCoordinator = new MarketFeedCoordinator();