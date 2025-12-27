// Execution Engine Service
// Handles order placement to broker

import { Broker } from '@/lib/brokers/broker.interface';
import { BrokerFactory, BrokerType } from '@/lib/brokers/brokerFactory';
import { AISignal } from '@/types/global';
import { recordTrade } from './tradeJournal';

export class ExecutionEngine {
  private broker: Broker;
  private brokerType: BrokerType;

  constructor(brokerType: BrokerType = 'MOCK', config: any = {}) {
    this.brokerType = brokerType;
    this.broker = BrokerFactory.create(brokerType, config);
  }

  async connect(config?: any): Promise<boolean> {
    try {
      return await this.broker.connect(config || {});
    } catch (error) {
      console.error('Execution Engine: Failed to connect broker:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.broker.disconnect();
  }

  async executeOrder(signal: AISignal): Promise<any> {
    try {
      const order = {
        orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tradingSymbol: signal.symbol,
        transactionType: signal.action === 'BUY' ? 'BUY' : 'SELL',
        quantity: signal.allocation || 100,
        price: signal.targets.entry,
        orderType: 'LIMIT',
        status: 'PENDING',
        averagePrice: 0,
        filledShares: '0'
      };

      const placedOrder = await this.broker.placeOrder(order);

      // Record trade in journal
      await recordTrade({
        signalId: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        probability: signal.probability,
        confidence: signal.confidence,
        strategy: signal.strategy,
        entryPrice: signal.targets.entry,
        targetPrice: signal.targets.t1,
        stopLoss: signal.targets.sl,
        timestamp: new Date().toISOString(),
        evidence: [],
        marketRegime: signal.marketRegime || 'UNKNOWN'
      });

      return placedOrder;
    } catch (error) {
      console.error('Execution Engine: Failed to place order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      return await this.broker.cancelOrder(orderId);
    } catch (error) {
      console.error('Execution Engine: Failed to cancel order:', error);
      return false;
    }
  }

  async getOrders(): Promise<any[]> {
    try {
      return await this.broker.getOrders();
    } catch (error) {
      console.error('Execution Engine: Failed to get orders:', error);
      return [];
    }
  }

  async getTrades(): Promise<any[]> {
    try {
      return await this.broker.getTrades();
    } catch (error) {
      console.error('Execution Engine: Failed to get trades:', error);
      return [];
    }
  }

  getBrokerType(): BrokerType {
    return this.brokerType;
  }
}

export default ExecutionEngine;
