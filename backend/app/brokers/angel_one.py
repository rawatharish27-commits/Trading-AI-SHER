"""
Angel One Broker Adapter
SmartAPI Integration for Trading Operations
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import hashlib

import httpx
import pyotp
from loguru import logger


@dataclass
class AngelOneConfig:
    """Angel One API Configuration"""
    api_key: str
    client_id: str
    password: str
    totp_secret: str


@dataclass
class Session:
    """Angel One session data"""
    jwt_token: str
    refresh_token: str
    feed_token: str
    client_code: str
    expires_at: datetime
    created_at: datetime


@dataclass
class OrderParams:
    """Order parameters"""
    variety: str = "NORMAL"  # NORMAL, AMO, STOPLOSS, ROBO
    tradingsymbol: str = ""
    symboltoken: str = ""
    transactiontype: str = "BUY"  # BUY, SELL
    exchange: str = "NSE"  # NSE, BSE, NFO, MCX
    ordertype: str = "MARKET"  # MARKET, LIMIT, STOPLOSS_LIMIT, STOPLOSS_MARKET
    producttype: str = "INTRADAY"  # DELIVERY, INTRADAY, MARGIN, BO, CO
    duration: str = "DAY"  # DAY, IOC
    price: float = 0.0
    quantity: int = 1
    squareoff: float = 0.0
    stoploss: float = 0.0
    trailingStopLoss: float = 0.0


@dataclass
class MarketQuote:
    """Market quote data"""
    symbol: str
    ltp: float
    change: float
    change_percent: float
    open: float
    high: float
    low: float
    close: float
    volume: int
    bid_price: float = 0.0
    ask_price: float = 0.0


class AngelOneAdapter:
    """
    Angel One SmartAPI Adapter
    
    Provides comprehensive integration with Angel One broker:
    - Authentication with TOTP
    - Order placement and management
    - Market data and quotes
    - Portfolio and positions
    - WebSocket streaming
    """

    BASE_URL = "https://apiconnect.angelone.in/rest"
    WS_URL = "wss://smartapisocket.angelone.in/smart-stream"

    def __init__(self, config: AngelOneConfig):
        """
        Initialize Angel One Adapter
        
        Args:
            config: Angel One configuration with API keys
        """
        self.config = config
        self.session: Optional[Session] = None
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        logger.info(f"🏦 Angel One Adapter initialized for client: {config.client_id}")

    # ==================== AUTHENTICATION ====================

    async def login(self) -> Session:
        """
        Login to Angel One and get session tokens
        
        Returns:
            Session with JWT and feed tokens
        """
        # Generate TOTP
        totp = pyotp.TOTP(self.config.totp_secret).now() if self.config.totp_secret else ""

        payload = {
            "clientcode": self.config.client_id,
            "password": self.config.password,
            "totp": totp,
        }

        headers = self._get_headers()

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/auth/angelbroking/user/v1/loginByPassword",
                json=payload,
                headers=headers
            )
            data = response.json()

            if not data.get("status"):
                error_msg = data.get("message", "Unknown error")
                raise Exception(f"Login failed: {error_msg}")

            # Parse session data
            session_data = data.get("data", {})
            self.session = Session(
                jwt_token=session_data.get("jwtToken", ""),
                refresh_token=session_data.get("refreshToken", ""),
                feed_token=session_data.get("feedToken", ""),
                client_code=self.config.client_id,
                expires_at=datetime.now() + timedelta(hours=24),
                created_at=datetime.now(),
            )

            logger.info(f"✅ Angel One login successful for {self.config.client_id}")
            return self.session

        except Exception as e:
            logger.error(f"❌ Angel One login failed: {e}")
            raise

    async def logout(self) -> bool:
        """Logout from Angel One"""
        if not self.session:
            return True

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/auth/angelbroking/user/v1/logout",
                json={"clientcode": self.config.client_id},
                headers=self._get_auth_headers()
            )
            data = response.json()
            self.session = None
            logger.info("👋 Angel One logged out")
            return data.get("status", False)
        except Exception as e:
            logger.warning(f"Logout warning: {e}")
            return True

    async def refresh_session(self) -> Session:
        """Refresh session using refresh token"""
        if not self.session:
            return await self.login()

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/auth/angelbroking/user/v1/refreshToken",
                json={"refreshtoken": self.session.refresh_token},
                headers=self._get_headers()
            )
            data = response.json()

            if data.get("status"):
                session_data = data.get("data", {})
                self.session.jwt_token = session_data.get("jwtToken", self.session.jwt_token)
                self.session.expires_at = datetime.now() + timedelta(hours=24)
                logger.info("🔄 Angel One session refreshed")
            else:
                # Refresh failed, re-login
                return await self.login()

            return self.session

        except Exception as e:
            logger.warning(f"Session refresh failed, re-logging in: {e}")
            return await self.login()

    def is_session_valid(self) -> bool:
        """Check if current session is valid"""
        if not self.session:
            return False
        return datetime.now() < self.session.expires_at - timedelta(minutes=5)

    # ==================== ORDER MANAGEMENT ====================

    async def place_order(self, params: OrderParams) -> Dict[str, Any]:
        """
        Place a new order
        
        Args:
            params: Order parameters
            
        Returns:
            Order response with order ID
        """
        if not self.is_session_valid():
            await self.refresh_session()

        payload = {
            "variety": params.variety,
            "tradingsymbol": params.tradingsymbol,
            "symboltoken": params.symboltoken,
            "transactiontype": params.transactiontype,
            "exchange": params.exchange,
            "ordertype": params.ordertype,
            "producttype": params.producttype,
            "duration": params.duration,
            "price": str(params.price),
            "quantity": str(params.quantity),
            "squareoff": str(params.squareoff) if params.squareoff else "0",
            "stoploss": str(params.stoploss) if params.stoploss else "0",
            "trailingStopLoss": str(params.trailingStopLoss) if params.trailingStopLoss else "0",
        }

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/secure/angelbroking/order/v1/placeOrder",
                json=payload,
                headers=self._get_auth_headers()
            )
            data = response.json()

            if not data.get("status"):
                raise Exception(f"Order failed: {data.get('message')}")

            order_id = data.get("data", {}).get("orderid")
            logger.info(f"📤 Order placed: {order_id} - {params.tradingsymbol} {params.transactiontype} {params.quantity}")

            return {
                "order_id": order_id,
                "status": "PLACED",
                "message": data.get("message", "Order placed successfully"),
            }

        except Exception as e:
            logger.error(f"❌ Order placement failed: {e}")
            raise

    async def modify_order(
        self,
        order_id: str,
        params: OrderParams
    ) -> Dict[str, Any]:
        """Modify an existing order"""
        if not self.is_session_valid():
            await self.refresh_session()

        payload = {
            "orderid": order_id,
            "variety": params.variety,
            "tradingsymbol": params.tradingsymbol,
            "symboltoken": params.symboltoken,
            "transactiontype": params.transactiontype,
            "exchange": params.exchange,
            "ordertype": params.ordertype,
            "producttype": params.producttype,
            "duration": params.duration,
            "price": str(params.price),
            "quantity": str(params.quantity),
        }

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/secure/angelbroking/order/v1/modifyOrder",
                json=payload,
                headers=self._get_auth_headers()
            )
            data = response.json()

            logger.info(f"📝 Order modified: {order_id}")
            return {
                "order_id": order_id,
                "status": "MODIFIED",
                "message": data.get("message", "Order modified"),
            }

        except Exception as e:
            logger.error(f"❌ Order modification failed: {e}")
            raise

    async def cancel_order(self, order_id: str, variety: str = "NORMAL") -> Dict[str, Any]:
        """Cancel an order"""
        if not self.is_session_valid():
            await self.refresh_session()

        payload = {
            "orderid": order_id,
            "variety": variety,
        }

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/secure/angelbroking/order/v1/cancelOrder",
                json=payload,
                headers=self._get_auth_headers()
            )
            data = response.json()

            logger.info(f"❌ Order cancelled: {order_id}")
            return {
                "order_id": order_id,
                "status": "CANCELLED",
                "message": data.get("message", "Order cancelled"),
            }

        except Exception as e:
            logger.error(f"❌ Order cancellation failed: {e}")
            raise

    async def get_order_book(self) -> List[Dict]:
        """Get order book"""
        if not self.is_session_valid():
            await self.refresh_session()

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/order/v1/getOrderBook",
                headers=self._get_auth_headers()
            )
            data = response.json()
            return data.get("data", [])

        except Exception as e:
            logger.error(f"❌ Failed to get order book: {e}")
            raise

    async def get_trade_book(self) -> List[Dict]:
        """Get trade book"""
        if not self.is_session_valid():
            await self.refresh_session()

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/order/v1/getTradeBook",
                headers=self._get_auth_headers()
            )
            data = response.json()
            return data.get("data", [])

        except Exception as e:
            logger.error(f"❌ Failed to get trade book: {e}")
            raise

    # ==================== PORTFOLIO ====================

    async def get_holdings(self) -> List[Dict]:
        """Get holdings"""
        if not self.is_session_valid():
            await self.refresh_session()

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/portfolio/v1/getHolding",
                headers=self._get_auth_headers()
            )
            data = response.json()
            return data.get("data", [])

        except Exception as e:
            logger.error(f"❌ Failed to get holdings: {e}")
            raise

    async def get_positions(self) -> Dict[str, List]:
        """Get positions (day and net)"""
        if not self.is_session_valid():
            await self.refresh_session()

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/portfolio/v1/getPosition",
                headers=self._get_auth_headers()
            )
            data = response.json()

            return {
                "day": data.get("data", {}).get("daypos", []),
                "net": data.get("data", {}).get("netpos", []),
            }

        except Exception as e:
            logger.error(f"❌ Failed to get positions: {e}")
            raise

    async def get_funds(self) -> Dict[str, float]:
        """Get available funds/margin"""
        if not self.is_session_valid():
            await self.refresh_session()

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/margin/v1/batch",
                headers=self._get_auth_headers()
            )
            data = response.json()

            fund_data = data.get("data", {})
            return {
                "available": float(fund_data.get("availablecash", 0)),
                "used": float(fund_data.get("utilised", 0)),
                "total": float(fund_data.get("collateral", 0)),
                "margin_used": float(fund_data.get("marginused", 0)),
            }

        except Exception as e:
            logger.error(f"❌ Failed to get funds: {e}")
            raise

    # ==================== MARKET DATA ====================

    async def get_quote(
        self,
        symbol_token: str,
        exchange: str = "NSE"
    ) -> MarketQuote:
        """Get market quote for a symbol"""
        if not self.is_session_valid():
            await self.refresh_session()

        payload = {
            "mode": "FULL",
            "exchange": exchange,
            "tradingSymbol": symbol_token,
        }

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/secure/angelbroking/market/v1/quote",
                json=payload,
                headers=self._get_auth_headers()
            )
            data = response.json()

            quote_data = data.get("data", {}).get("fetched", [{}])[0]

            return MarketQuote(
                symbol=symbol_token,
                ltp=float(quote_data.get("ltp", 0)),
                change=float(quote_data.get("change", 0)),
                change_percent=float(quote_data.get("pChange", 0)),
                open=float(quote_data.get("open", 0)),
                high=float(quote_data.get("high", 0)),
                low=float(quote_data.get("low", 0)),
                close=float(quote_data.get("close", 0)),
                volume=int(quote_data.get("volume", 0)),
            )

        except Exception as e:
            logger.error(f"❌ Failed to get quote: {e}")
            raise

    async def get_ltp(
        self,
        symbol_token: str,
        exchange: str = "NSE"
    ) -> float:
        """Get last traded price"""
        if not self.is_session_valid():
            await self.refresh_session()

        payload = {
            "exchange": exchange,
            "tradingSymbol": symbol_token,
        }

        try:
            response = await self.http_client.post(
                f"{self.BASE_URL}/secure/angelbroking/market/v1/getLTP",
                json=payload,
                headers=self._get_auth_headers()
            )
            data = response.json()

            return float(data.get("data", {}).get("ltp", 0))

        except Exception as e:
            logger.error(f"❌ Failed to get LTP: {e}")
            raise

    async def get_historical_data(
        self,
        symbol_token: str,
        exchange: str = "NSE",
        interval: str = "ONE_DAY",
        from_date: str = "",
        to_date: str = ""
    ) -> List[Dict]:
        """Get historical OHLC data"""
        if not self.is_session_valid():
            await self.refresh_session()

        params = {
            "exchange": exchange,
            "symboltoken": symbol_token,
            "interval": interval,
            "fromdate": from_date,
            "todate": to_date,
        }

        try:
            response = await self.http_client.get(
                f"{self.BASE_URL}/secure/angelbroking/historical/v1/getCandleData",
                params=params,
                headers=self._get_auth_headers()
            )
            data = response.json()

            return data.get("data", [])

        except Exception as e:
            logger.error(f"❌ Failed to get historical data: {e}")
            raise

    # ==================== HELPER METHODS ====================

    def _get_headers(self) -> Dict[str, str]:
        """Get base headers"""
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-UserType": "USER",
            "X-SourceID": "WEB",
            "X-ClientLocalIP": "127.0.0.1",
            "X-ClientPublicIP": "127.0.0.1",
            "X-MACAddress": "00:00:00:00:00:00",
            "X-PrivateKey": self.config.api_key,
        }

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authenticated headers"""
        headers = self._get_headers()
        if self.session:
            headers["Authorization"] = f"Bearer {self.session.jwt_token}"
        return headers

    def get_feed_token(self) -> Optional[str]:
        """Get feed token for WebSocket"""
        return self.session.feed_token if self.session else None

    def get_websocket_url(self) -> str:
        """Get WebSocket URL"""
        return self.WS_URL

    async def close(self) -> None:
        """Close HTTP client"""
        await self.http_client.aclose()
        logger.info("🔌 Angel One adapter closed")
