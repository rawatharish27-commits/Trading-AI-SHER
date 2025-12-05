
import { useState, useEffect, useRef } from 'react';
import { MarketTick, ChartDataPoint, LivePriceResponse } from '../types';

// Configuration
const REFRESH_RATE_MS = 2000; // Poll every 2 seconds
const INITIAL_EQUITY = 245300;

const INITIAL_INDICES = {
  NIFTY50: { symbol: 'NIFTY 50', price: 21450.00, change: 120.50, changePercent: 0.56, timestamp: Date.now(), volume: 0 },
  BANKNIFTY: { symbol: 'BANK NIFTY', price: 47800.00, change: -150.25, changePercent: -0.31, timestamp: Date.now(), volume: 0 },
  SENSEX: { symbol: 'SENSEX', price: 71300.00, change: 210.00, changePercent: 0.29, timestamp: Date.now(), volume: 0 },
};

/**
 * Phase 4: Market Data Pipeline Bridge
 * Connects to Next.js API endpoints which interface with the DB/Ingest Service.
 */
export const useMarketStream = (isAuthenticated: boolean) => {
  const [indices, setIndices] = useState(INITIAL_INDICES);
  const [equityData, setEquityData] = useState<ChartDataPoint[]>([]);
  const [currentEquity, setCurrentEquity] = useState(INITIAL_EQUITY);
  const [isLive, setIsLive] = useState(false);
  
  const equityRef = useRef(INITIAL_EQUITY);

  // Helper to fetch live price from API
  const fetchQuote = async (symbol: string): Promise<MarketTick | null> => {
    try {
      const res = await fetch(`/api/prices/live?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      const data: LivePriceResponse = await res.json();
      return {
        symbol: data.symbol,
        price: data.lastPrice,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        timestamp: new Date(data.lastUpdated).getTime(),
        volume: data.dayVolume || 0
      };
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize Chart (Mock History for Dashboard Visuals)
    const initialChart: ChartDataPoint[] = [];
    let tempEquity = INITIAL_EQUITY - 5000;
    const now = new Date();
    for (let i = 60; i > 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        tempEquity = tempEquity + (Math.random() - 0.5) * 50;
        initialChart.push({
            date: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            equity: Number(tempEquity.toFixed(2))
        });
    }
    setEquityData(initialChart);
    equityRef.current = tempEquity;
    setCurrentEquity(tempEquity);
    setIsLive(true);

    const updateMarket = async () => {
      // Fetch live indices from API
      const nifty = await fetchQuote('NIFTY 50');
      const bank = await fetchQuote('BANK NIFTY');
      const sensex = await fetchQuote('SENSEX');

      setIndices(prev => ({
        NIFTY50: nifty || prev.NIFTY50,
        BANKNIFTY: bank || prev.BANKNIFTY,
        SENSEX: sensex || prev.SENSEX,
      }));

      // Simulate Equity Update (In real app, fetch from /api/portfolio/summary)
      const change = (Math.random() - 0.5) * 100;
      const newEquity = equityRef.current + change;
      equityRef.current = newEquity;
      setCurrentEquity(newEquity);

      setEquityData(prev => {
        const newPoint = {
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            equity: newEquity
        };
        const newData = [...prev, newPoint];
        if (newData.length > 60) newData.shift();
        return newData;
      });
    };

    const interval = setInterval(updateMarket, REFRESH_RATE_MS);
    return () => {
      clearInterval(interval);
      setIsLive(false);
    };
  }, [isAuthenticated]);

  return {
    indices,
    equityData,
    currentEquity,
    isConnected: isLive
  };
};
