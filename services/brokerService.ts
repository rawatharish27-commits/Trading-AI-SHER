
import { BrokerConfig, PortfolioItem, BrokerOrder, BrokerTrade, PortfolioSummary } from '../types';
import { API_CONFIG } from '../lib/api/config';

export const connectBroker = async (config: BrokerConfig): Promise<{ success: boolean; message: string; session?: any }> => {
  try {
    const response = await fetch(API_CONFIG.getAbsoluteUrl('/api/broker/connect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || data.error || 'Connection attempt finished.',
      session: data.session
    };
  } catch (error) {
    return { success: false, message: 'Failed to reach broker bridge.' };
  }
};

// Fix: Added logoutBroker to resolve Module '"../../services/brokerService"' has no exported member 'logoutBroker' error.
export const logoutBroker = async (config: BrokerConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(API_CONFIG.getAbsoluteUrl('/api/broker/logout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || data.error || 'Logout attempt finished.'
    };
  } catch (error) {
    return { success: false, message: 'Failed to reach broker bridge for logout.' };
  }
};

export const fetchAllHoldings = async (): Promise<{ holdings: PortfolioItem[]; summary: PortfolioSummary | null }> => {
  try {
    const response = await fetch(API_CONFIG.getAbsoluteUrl('/api/broker/portfolio/holdings'));
    if (!response.ok) return { holdings: [], summary: null };
    const data = await response.json();
    
    const holdings = (data.holdings || []).map((h: any) => ({
      id: h.isin || h.symboltoken,
      symbol: h.tradingsymbol,
      assetClass: 'EQUITY',
      quantity: h.quantity,
      avgPrice: h.averageprice,
      currentPrice: h.ltp,
      pnl: h.profitandloss,
      pnlPercent: h.pnlpercentage,
      exchange: h.exchange,
      isin: h.isin,
      product: h.product
    }));

    return { holdings, summary: data.totalholding || null };
  } catch (error) {
    console.error('Error fetching all holdings:', error);
    return { holdings: [], summary: null };
  }
};

// Fix: Added fetchMarketData to resolve Module '"../services/brokerService"' has no exported member 'fetchMarketData' error.
export const fetchMarketData = async (mode: string, exchangeTokens: any): Promise<any> => {
  try {
    const response = await fetch(API_CONFIG.getAbsoluteUrl('/api/broker/market-data'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, exchangeTokens }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
};
