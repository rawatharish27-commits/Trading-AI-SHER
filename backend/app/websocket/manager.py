"""
WebSocket Market Data Service
Real-time market data streaming
"""

import asyncio
import json
from datetime import datetime
from typing import Callable, Dict, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger
from fastapi import WebSocket, WebSocketDisconnect


class SubscriptionMode(str, Enum):
    """WebSocket subscription modes"""
    LTP = "LTP"           # Last traded price only
    QUOTE = "QUOTE"       # Full quote data
    SNAP_QUOTE = "SNAP"   # Snapshot quote


@dataclass
class MarketData:
    """Real-time market data"""
    symbol: str
    token: str
    exchange: str
    ltp: float
    change: float
    change_percent: float
    volume: int
    bid_price: float
    ask_price: float
    high: float
    low: float
    open: float
    close: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Subscription:
    """Client subscription details"""
    client_id: str
    symbols: Set[str]
    mode: SubscriptionMode
    callback: Optional[Callable] = None


class ConnectionManager:
    """
    WebSocket Connection Manager
    
    Manages:
    - Client connections
    - Subscriptions
    - Broadcasting market data
    """

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Subscription] = {}
        self.symbol_subscribers: Dict[str, Set[str]] = {}  # symbol -> client_ids
        
        logger.info("🔌 WebSocket Connection Manager initialized")

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.subscriptions[client_id] = Subscription(
            client_id=client_id,
            symbols=set(),
            mode=SubscriptionMode.LTP
        )
        logger.info(f"✅ Client connected: {client_id}")

    def disconnect(self, client_id: str) -> None:
        """Handle client disconnection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        if client_id in self.subscriptions:
            # Remove from symbol subscribers
            for symbol in self.subscriptions[client_id].symbols:
                if symbol in self.symbol_subscribers:
                    self.symbol_subscribers[symbol].discard(client_id)
            
            del self.subscriptions[client_id]
        
        logger.info(f"❌ Client disconnected: {client_id}")

    async def subscribe(
        self,
        client_id: str,
        symbols: List[str],
        mode: SubscriptionMode = SubscriptionMode.LTP
    ) -> None:
        """Subscribe client to symbols"""
        if client_id not in self.subscriptions:
            return
        
        subscription = self.subscriptions[client_id]
        subscription.mode = mode
        
        for symbol in symbols:
            subscription.symbols.add(symbol)
            
            if symbol not in self.symbol_subscribers:
                self.symbol_subscribers[symbol] = set()
            self.symbol_subscribers[symbol].add(client_id)
        
        logger.info(f"📡 Client {client_id} subscribed to: {symbols}")

    async def unsubscribe(self, client_id: str, symbols: List[str]) -> None:
        """Unsubscribe client from symbols"""
        if client_id not in self.subscriptions:
            return
        
        subscription = self.subscriptions[client_id]
        
        for symbol in symbols:
            subscription.symbols.discard(symbol)
            
            if symbol in self.symbol_subscribers:
                self.symbol_subscribers[symbol].discard(client_id)
        
        logger.info(f"📤 Client {client_id} unsubscribed from: {symbols}")

    async def broadcast_to_symbol(self, symbol: str, data: Dict) -> None:
        """Broadcast data to all subscribers of a symbol"""
        if symbol not in self.symbol_subscribers:
            return
        
        message = json.dumps({
            "type": "market_data",
            "symbol": symbol,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        disconnected = []
        
        for client_id in self.symbol_subscribers[symbol]:
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send to {client_id}: {e}")
                    disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect(client_id)

    async def broadcast_all(self, message: Dict) -> None:
        """Broadcast message to all connected clients"""
        text = json.dumps(message)
        
        disconnected = []
        
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(text)
            except Exception:
                disconnected.append(client_id)
        
        for client_id in disconnected:
            self.disconnect(client_id)

    async def send_to_client(self, client_id: str, message: Dict) -> bool:
        """Send message to specific client"""
        if client_id not in self.active_connections:
            return False
        
        try:
            await self.active_connections[client_id].send_json(message)
            return True
        except Exception as e:
            logger.warning(f"Failed to send to {client_id}: {e}")
            self.disconnect(client_id)
            return False

    def get_subscribers(self, symbol: str) -> Set[str]:
        """Get all subscribers for a symbol"""
        return self.symbol_subscribers.get(symbol, set())

    def get_client_symbols(self, client_id: str) -> Set[str]:
        """Get all symbols subscribed by a client"""
        if client_id in self.subscriptions:
            return self.subscriptions[client_id].symbols
        return set()


class MarketDataStreamer:
    """
    Market Data Streaming Service
    
    Handles:
    - Connection to broker WebSocket
    - Data processing and distribution
    - Heartbeat and reconnection
    """

    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.is_running = False
        self.broker_ws = None
        self.reconnect_interval = 5
        self.heartbeat_interval = 30
        
        logger.info("📊 Market Data Streamer initialized")

    async def start(self) -> None:
        """Start the streaming service"""
        self.is_running = True
        logger.info("🚀 Market Data Streamer started")
        
        # Start background tasks
        asyncio.create_task(self._mock_data_generator())
        asyncio.create_task(self._heartbeat_loop())

    async def stop(self) -> None:
        """Stop the streaming service"""
        self.is_running = False
        logger.info("🛑 Market Data Streamer stopped")

    async def _mock_data_generator(self) -> None:
        """Generate mock market data for development"""
        import random
        
        base_prices = {
            "RELIANCE": 2450.0,
            "TCS": 3850.0,
            "HDFC": 1650.0,
            "INFY": 1550.0,
            "ICICI": 1050.0,
            "SBIN": 750.0,
            "TATAMOTORS": 850.0,
            "MARUTI": 10500.0,
        }
        
        while self.is_running:
            try:
                for symbol, base_price in base_prices.items():
                    # Check if anyone is subscribed
                    subscribers = self.manager.get_subscribers(symbol)
                    if not subscribers:
                        continue
                    
                    # Generate mock data
                    change = random.uniform(-2, 2)
                    ltp = base_price + random.uniform(-20, 20)
                    
                    data = {
                        "ltp": round(ltp, 2),
                        "change": round(change, 2),
                        "change_percent": round(change / base_price * 100, 2),
                        "volume": random.randint(100000, 1000000),
                        "bid": round(ltp - random.uniform(0, 2), 2),
                        "ask": round(ltp + random.uniform(0, 2), 2),
                        "high": round(ltp + random.uniform(10, 30), 2),
                        "low": round(ltp - random.uniform(10, 30), 2),
                        "open": round(base_price + random.uniform(-10, 10), 2),
                        "close": round(base_price, 2),
                    }
                    
                    await self.manager.broadcast_to_symbol(symbol, data)
                
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Mock data generator error: {e}")
                await asyncio.sleep(5)

    async def _heartbeat_loop(self) -> None:
        """Send heartbeat to all clients"""
        while self.is_running:
            try:
                await self.manager.broadcast_all({
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })
                await asyncio.sleep(self.heartbeat_interval)
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(5)


@dataclass
class SignalSubscription:
    """Signal subscription details"""
    client_id: str
    symbols: Set[str]
    strategies: Set[str]  # "SMC", "PROBABILITY", etc.
    min_quality: float = 0.0


class SignalManager:
    """
    Signal Streaming Manager

    Manages:
    - Signal subscriptions
    - Real-time signal broadcasting
    - Signal monitoring and cleanup
    """

    def __init__(self):
        self.signal_connections: Dict[str, WebSocket] = {}
        self.signal_subscriptions: Dict[str, SignalSubscription] = {}
        self.symbol_signal_subscribers: Dict[str, Set[str]] = {}  # symbol -> client_ids

        logger.info("📡 Signal Manager initialized")

    async def connect_signals(self, websocket: WebSocket, client_id: str) -> None:
        """Accept new signal WebSocket connection"""
        await websocket.accept()
        self.signal_connections[client_id] = websocket
        self.signal_subscriptions[client_id] = SignalSubscription(
            client_id=client_id,
            symbols=set(),
            strategies={"SMC"}  # Default to SMC
        )
        logger.info(f"📡 Signal client connected: {client_id}")

    def disconnect_signals(self, client_id: str) -> None:
        """Handle signal client disconnection"""
        if client_id in self.signal_connections:
            del self.signal_connections[client_id]

        if client_id in self.signal_subscriptions:
            # Remove from symbol subscribers
            for symbol in self.signal_subscriptions[client_id].symbols:
                if symbol in self.symbol_signal_subscribers:
                    self.symbol_signal_subscribers[symbol].discard(client_id)

            del self.signal_subscriptions[client_id]

        logger.info(f"📡 Signal client disconnected: {client_id}")

    async def subscribe_signals(
        self,
        client_id: str,
        symbols: List[str],
        strategies: Optional[List[str]] = None,
        min_quality: float = 0.0
    ) -> None:
        """Subscribe client to signals"""
        if client_id not in self.signal_subscriptions:
            return

        subscription = self.signal_subscriptions[client_id]
        subscription.symbols.update(symbols)
        subscription.min_quality = min_quality

        if strategies:
            subscription.strategies.update(strategies)

        for symbol in symbols:
            if symbol not in self.symbol_signal_subscribers:
                self.symbol_signal_subscribers[symbol] = set()
            self.symbol_signal_subscribers[symbol].add(client_id)

        logger.info(f"📡 Client {client_id} subscribed to signals: {symbols}")

    async def unsubscribe_signals(self, client_id: str, symbols: List[str]) -> None:
        """Unsubscribe client from signals"""
        if client_id not in self.signal_subscriptions:
            return

        subscription = self.signal_subscriptions[client_id]

        for symbol in symbols:
            subscription.symbols.discard(symbol)

            if symbol in self.symbol_signal_subscribers:
                self.symbol_signal_subscribers[symbol].discard(client_id)

        logger.info(f"📡 Client {client_id} unsubscribed from signals: {symbols}")

    async def broadcast_signal(self, signal_data: Dict) -> None:
        """Broadcast signal to subscribed clients"""
        symbol = signal_data.get("symbol", "")
        strategy = signal_data.get("strategy", "SMC")
        quality_score = signal_data.get("quality_score", 0.0)

        if symbol not in self.symbol_signal_subscribers:
            return

        message = {
            "type": "signal",
            "data": signal_data,
            "timestamp": datetime.utcnow().isoformat()
        }

        disconnected: List[str] = []

        for client_id in self.symbol_signal_subscribers[symbol]:
            if client_id in self.signal_subscriptions:
                subscription = self.signal_subscriptions[client_id]

                # Check filters
                if strategy not in subscription.strategies:
                    continue
                if quality_score < subscription.min_quality:
                    continue

                # Send to client
                if client_id in self.signal_connections:
                    try:
                        await self.signal_connections[client_id].send_json(message)
                    except Exception as e:
                        logger.warning(f"Failed to send signal to {client_id}: {e}")
                        disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            self.disconnect_signals(client_id)

    async def send_to_signal_client(self, client_id: str, message: Dict) -> bool:
        """Send message to specific signal client"""
        if client_id not in self.signal_connections:
            return False

        try:
            await self.signal_connections[client_id].send_json(message)
            return True
        except Exception as e:
            logger.warning(f"Failed to send to signal client {client_id}: {e}")
            self.disconnect_signals(client_id)
            return False


# Singleton instances
connection_manager = ConnectionManager()
market_streamer = MarketDataStreamer(connection_manager)
signal_manager = SignalManager()
