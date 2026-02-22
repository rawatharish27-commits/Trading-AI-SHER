"""
Order Service
Business logic for order management
"""

from datetime import datetime
from typing import Dict, List, Optional
import uuid

from loguru import logger

from app.engines import risk_system, TradeRequest, RiskAudit


class OrderService:
    """
    Order Management Service
    
    Handles:
    - Order validation
    - Risk checks
    - Order execution
    - Order tracking
    """

    async def place_order(
        self,
        user_id: int,
        symbol: str,
        side: str,
        quantity: int,
        price: float = 0,
        order_type: str = "MARKET",
        exchange: str = "NSE",
        stop_loss: Optional[float] = None,
        target: Optional[float] = None,
        strategy: Optional[str] = None
    ) -> Dict:
        """
        Place a new order
        
        Args:
            user_id: User ID
            symbol: Trading symbol
            side: BUY or SELL
            quantity: Order quantity
            price: Order price (0 for market orders)
            order_type: MARKET, LIMIT, etc.
            exchange: Exchange
            stop_loss: Stop loss price
            target: Target price
            strategy: Strategy name
            
        Returns:
            Order result
        """
        order_id = str(uuid.uuid4())[:12]
        logger.info(f"[{order_id}] Placing order: {side} {quantity} {symbol}")
        
        # 1. Create trade request for risk audit
        trade_request = TradeRequest(
            symbol=symbol,
            exchange=exchange,
            side=side,
            quantity=quantity,
            price=price if price > 0 else 0,
            stop_loss=stop_loss,
            target=target,
            strategy=strategy
        )
        
        # 2. Run risk audit
        risk_audit = await risk_system.audit_trade(trade_request)
        
        if not risk_audit.allowed:
            logger.warning(f"[{order_id}] Order rejected by risk: {risk_audit.reason}")
            return {
                "status": "REJECTED",
                "order_id": order_id,
                "reason": risk_audit.reason,
                "risk_rating": risk_audit.risk_rating.value,
                "suggested_quantity": risk_audit.suggested_quantity
            }
        
        # 3. Validate order parameters
        validation = self._validate_order(symbol, side, quantity, price, exchange)
        if not validation["valid"]:
            return {
                "status": "REJECTED",
                "order_id": order_id,
                "reason": validation["reason"]
            }
        
        # 4. Create order record (in production, save to database)
        order = {
            "order_id": order_id,
            "user_id": user_id,
            "symbol": symbol,
            "exchange": exchange,
            "side": side,
            "order_type": order_type,
            "quantity": quantity,
            "price": price,
            "stop_loss": stop_loss,
            "target": target,
            "status": "PENDING",
            "risk_audit": {
                "rating": risk_audit.risk_rating.value,
                "firewall_code": risk_audit.firewall_code,
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        # 5. Submit to broker (mock for development)
        broker_result = await self._submit_to_broker(order)
        
        order["status"] = broker_result["status"]
        order["broker_order_id"] = broker_result.get("broker_order_id")
        
        logger.info(f"[{order_id}] Order placed: {order['status']}")
        return order

    async def cancel_order(self, order_id: str, user_id: int) -> Dict:
        """Cancel an order"""
        logger.info(f"[{order_id}] Cancelling order")
        
        # In production, cancel with broker and update database
        return {
            "order_id": order_id,
            "status": "CANCELLED",
            "message": "Order cancelled successfully"
        }

    async def get_order_status(self, order_id: str, user_id: int) -> Dict:
        """Get order status"""
        # In production, fetch from database
        return {
            "order_id": order_id,
            "status": "PENDING",
            "message": "Order status retrieved"
        }

    async def get_order_book(self, user_id: int) -> List[Dict]:
        """Get user's order book"""
        # In production, fetch from database
        return []

    def _validate_order(
        self,
        symbol: str,
        side: str,
        quantity: int,
        price: float,
        exchange: str
    ) -> Dict:
        """Validate order parameters"""
        if side not in ["BUY", "SELL"]:
            return {"valid": False, "reason": "Invalid side. Must be BUY or SELL"}
        
        if quantity <= 0:
            return {"valid": False, "reason": "Quantity must be positive"}
        
        if exchange not in ["NSE", "BSE", "NFO", "MCX", "CDS"]:
            return {"valid": False, "reason": "Invalid exchange"}
        
        if not symbol or len(symbol) < 1:
            return {"valid": False, "reason": "Invalid symbol"}
        
        return {"valid": True}

    async def _submit_to_broker(self, order: Dict) -> Dict:
        """Submit order to broker"""
        # Mock broker submission
        await self._simulate_delay(0.1)
        
        return {
            "status": "SUBMITTED",
            "broker_order_id": f"BRK-{order['order_id']}"
        }

    async def _simulate_delay(self, seconds: float):
        """Simulate network delay"""
        import asyncio
        await asyncio.sleep(seconds)


# Singleton instance
order_service = OrderService()
