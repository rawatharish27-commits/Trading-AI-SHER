import { eventBus } from "./eventBus";
import { TickState } from "./TickEngine";
import { ProbabilityBrain } from "../probability/ProbabilityBrain";
import { RegimeDetector } from "../probability/RegimeDetector";
import { ensembleEngine } from "../strategy/EnsembleEngine";
import { PositionSizer } from "../execution/PositionSizer";
import { PortfolioController } from "../portfolio/PortfolioController";
import { ExecutionRouter } from "../execution/ExecutionRouter";
import { PortfolioSnapshot } from "../execution/types";

/**
 * 🦁 STRATEGY ENGINE (V5 - Sovereign Execution)
 */
class StrategyEngine {
  constructor() {
    this.initialize();
  }

  private initialize() {
    eventBus.subscribe('market.tick', (event) => {
      this.evaluate(event.payload as TickState);
    });
  }

  private async evaluate(tick: TickState) {
    if (tick.tickHistory.length < 50) return;

    // 1. Probability & Consensus Shards (Phase 1 & 2)
    const regime = RegimeDetector.detect(tick.tickHistory, 25);
    const ensembleResult = await ensembleEngine.vote(tick, regime);

    if (ensembleResult.decision === 'NO_TRADE') return;

    const result = ProbabilityBrain.synthesize(tick.tickHistory, 25, ensembleResult.opinions.map(op => ({
      id: op.strategyId,
      source: 'STRATEGY_NODE',
      bias: op.direction as any,
      strength: op.evidenceStrength,
      weight: op.regimeFit
    })));

    if (result.decision === 'NO_TRADE') return;

    // --- PHASE 3: EXECUTION ARCHITECTURE ---

    // 2. Position Sizing
    const qty = PositionSizer.calculate({
      equity: 1000000, // Mock Capital
      stopLossPoints: tick.ltp * 0.01, // 1% SL Shard
      confidence: ensembleResult.consensusStrength,
      regimeVolatility: (25 / tick.ltp) * 100,
      currentDrawdown: 0.005 // 0.5% mock DD
    }, tick.ltp);

    if (qty <= 0) return;

    // 3. Portfolio Validation
    const mockPortfolio: PortfolioSnapshot = {
      totalExposure: 2000000,
      directionalBias: 0.2,
      sectorConcentration: { 'FINANCE': 0.15 },
      activeTradesCount: 4,
      dailyPnL: 5000
    };

    const audit = PortfolioController.validate(mockPortfolio, qty * tick.ltp, 'GENERAL');
    if (!audit.allowed) {
      console.debug(`🦁 [Portfolio] Veto for ${tick.symbol}: ${audit.reason}`);
      return;
    }

    // 4. Execution Routing
    const intent = ExecutionRouter.route(tick.symbol, result.decision as any, qty, (25/tick.ltp)*100, tick.ltp);

    // 5. Dispatch to Execution Shard
    eventBus.emit('alpha.discovery', {
      symbol: tick.symbol,
      action: result.decision,
      quantity: intent.quantity,
      orderType: intent.orderType,
      probability: result.shard.final,
      confidence: 1 - result.shard.uncertainty,
      reasoning: `${ensembleResult.reason} | EXEC: ${intent.orderType}`
    }, 'STRATEGY_ENGINE');
  }
}

export const strategyEngine = new StrategyEngine();