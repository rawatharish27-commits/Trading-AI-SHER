
import { useState, useEffect, useRef, useMemo } from 'react';
import { MarketTick, ChartDataPoint, AssetClass, DataMode } from '../types';
import { pnlService } from '../lib/services/pnlService';
import { wsWatchdog } from '../lib/services/wsWatchdog';
import { marketSimulator } from '../lib/services/marketSimulator';
import { tokenStore } from '../lib/services/tokenStore';
import { SessionEngine } from '../lib/market/sessionEngine';
import { DataModeResolver } from '../lib/market/dataModeResolver';
import { TickFirewall } from '../lib/market/tickFirewall';
import { equityService } from '../lib/services/equityService';

const INITIAL_EQUITY = 245300;

export const useMarketStream = (isAuthenticated: boolean, watchlistSymbols: string[] = [], mode: 'DEMO' | 'LIVE' = 'DEMO') => {
  const [livePrices, setLivePrices] = useState<{ [key: string]: MarketTick }>({});
  const [currentEquity, setCurrentEquity] = useState(INITIAL_EQUITY);
  const [currentDataMode, setCurrentDataMode] = useState<DataMode>(DataMode.EOD);
  // Fix: Added state for equityData to be returned by the hook to resolve TypeScript property access errors in App.tsx.
  const [equityData, setEquityData] = useState<ChartDataPoint[]>(equityService.snapshot().curve);
  
  const pricesRef = useRef<{ [key: string]: MarketTick }>({});

  // 🛡️ AUTHENTICITY GUARD: Check if broker credentials actually exist for LIVE mode
  const isBrokerActive = useMemo(() => tokenStore.isValid() && mode === 'LIVE', [isAuthenticated, mode]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const streamInterval = setInterval(() => {
        // 1. Resolve Global Operational State (Time-aware)
        const sessionStatus = SessionEngine.getSessionStatus();
        const resolvedMode = DataModeResolver.resolve(wsWatchdog.isHealthy(), isBrokerActive);
        
        // NSE/BSE Market-Hours Enforcement
        const finalMode = sessionStatus === 'CLOSED' ? DataMode.EOD : resolvedMode;
        setCurrentDataMode(finalMode);

        const baseIndices = ['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY'];
        const symbols = [...new Set([...watchlistSymbols, ...baseIndices])];
        const nextPrices = { ...pricesRef.current };

        symbols.forEach(symbol => {
          const key = symbol.replace(/\s/g, '').toUpperCase();
          const lastTick = nextPrices[key];
          let updatedTick: MarketTick;

          // CASE A: MARKET_FREEZE (Holidays/Weekends/Night)
          if (finalMode === DataMode.EOD) {
             if (lastTick) {
                nextPrices[key] = { ...lastTick, dataMode: DataMode.EOD };
             }
             return;
          }

          // CASE B: SIMULATED_FEED (Demo Mode or Lagged Socket)
          if (finalMode === DataMode.SIMULATED) {
             const sim = marketSimulator.generateTick(symbol, lastTick?.price || 24000);
             updatedTick = { ...sim, dataMode: DataMode.SIMULATED };
          } 
          // CASE C: LIVE_EXCHANGE (Real Money Shard)
          else {
             // In production, this pulls from the AngelOneWS background state
             const live = marketSimulator.generateTick(symbol, lastTick?.price || 24000); // Placeholder for real WS data
             const audit = TickFirewall.validate(live, DataMode.LIVE);
             
             if (audit.valid) {
                updatedTick = { ...live, dataMode: DataMode.LIVE };
             } else {
                console.error(`🛡️ [Firewall] Node ${symbol} rejected: ${audit.reason}`);
                return;
             }
          }

          nextPrices[key] = updatedTick!;
          pnlService.onPriceTick(symbol, updatedTick!.price);
        });

        pricesRef.current = nextPrices;
        setLivePrices({ ...nextPrices });
        wsWatchdog.onTick();

        // Fix: Added equity update logic to keep track of portfolio performance over time and provide curve data to components.
        const pnl = pnlService.snapshot();
        equityService.update(pnl.realized, pnl.unrealized);
        const snapshot = equityService.snapshot();
        setCurrentEquity(snapshot.currentEquity);
        setEquityData(snapshot.curve);
    }, 1000);

    return () => clearInterval(streamInterval);
  }, [isAuthenticated, watchlistSymbols.length, isBrokerActive, mode]);

  return { 
    livePrices, 
    dataMode: currentDataMode,
    indices: { 
        NIFTY50: livePrices.NIFTY50 || { symbol: 'NIFTY 50', price: 24500, change: 0, changePercent: 0, timestamp: 0, volume: 0 },
        BANKNIFTY: livePrices.BANKNIFTY || { symbol: 'BANK NIFTY', price: 52000, change: 0, changePercent: 0, timestamp: 0, volume: 0 },
        SENSEX: livePrices.SENSEX || { symbol: 'SENSEX', price: 79000, change: 0, changePercent: 0, timestamp: 0, volume: 0 },
        FINNIFTY: livePrices.FINNIFTY || { symbol: 'FINNIFTY', price: 23200, change: 0, changePercent: 0, timestamp: 0, volume: 0 }
    }, 
    currentEquity,
    // Fix: Added equityData to the return object to resolve "Property 'equityData' does not exist on type" error in App.tsx.
    equityData
  };
};
