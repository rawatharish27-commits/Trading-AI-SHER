"""
Database Seed
Initial data seeding for development/testing
"""

import asyncio
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.core.security import get_password_hash
from app.models.user import User, UserRole, Plan
from app.models.tenant import Tenant, TenantPlan, TenantStatus
from app.models.signal import (
    Signal,
    SignalAction,
    SignalDirection,
    SignalStatus,
    ConfidenceLevel,
    RiskLevel,
    MarketRegime,
)
from app.models.order import Order, OrderType, OrderStatus, OrderSide, ProductType
from app.models.position import Position, PositionSide, PositionStatus
from app.models.portfolio import Portfolio


class DatabaseSeeder:
    """Seed database with initial/test data"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def seed_all(self) -> Dict[str, Any]:
        """Seed all data"""
        results = {}

        # Seed in order (respecting foreign keys)
        results["tenants"] = await self.seed_tenants()
        results["users"] = await self.seed_users()
        results["portfolios"] = await self.seed_portfolios()
        results["signals"] = await self.seed_signals()
        results["orders"] = await self.seed_orders()
        results["positions"] = await self.seed_positions()

        return results

    async def seed_tenants(self, count: int = 3) -> List[Tenant]:
        """Seed tenants"""
        tenants = [
            Tenant(
                name="Trading Pro Enterprises",
                slug="trading-pro",
                contact_email="admin@tradingpro.com",
                plan=TenantPlan.PROFESSIONAL,
                status=TenantStatus.ACTIVE,
                max_users=20,
                max_signals_per_day=500,
                max_api_calls_per_day=10000,
            ),
            Tenant(
                name="Elite Traders Club",
                slug="elite-traders",
                contact_email="admin@elitetraders.com",
                plan=TenantPlan.ENTERPRISE,
                status=TenantStatus.ACTIVE,
                max_users=100,
                max_signals_per_day=2000,
                max_api_calls_per_day=50000,
            ),
            Tenant(
                name="Demo Company",
                slug="demo",
                contact_email="demo@example.com",
                plan=TenantPlan.STARTER,
                status=TenantStatus.TRIAL,
                max_users=5,
                max_signals_per_day=50,
                max_api_calls_per_day=1000,
            ),
        ]

        for tenant in tenants:
            self.session.add(tenant)

        await self.session.flush()
        return tenants

    async def seed_users(self, count: int = 10) -> List[User]:
        """Seed users"""
        users = [
            User(
                email="admin@sher.com",
                mobile="+919999999999",
                hashed_password=get_password_hash("admin123"),
                first_name="Admin",
                last_name="User",
                role=UserRole.ADMIN,
                plan=Plan.ELITE,
                is_active=True,
                is_verified=True,
                onboarding_completed=True,
            ),
            User(
                email="trader@sher.com",
                mobile="+919999999998",
                hashed_password=get_password_hash("trader123"),
                first_name="John",
                last_name="Trader",
                city="Mumbai",
                state="Maharashtra",
                role=UserRole.TRADER,
                plan=Plan.PRO,
                is_active=True,
                is_verified=True,
                onboarding_completed=True,
            ),
            User(
                email="viewer@sher.com",
                mobile="+919999999997",
                hashed_password=get_password_hash("viewer123"),
                first_name="Jane",
                last_name="Viewer",
                role=UserRole.VIEWER,
                plan=Plan.FREE,
                is_active=True,
                is_verified=True,
            ),
        ]

        # Add random users
        for i in range(count - 3):
            users.append(User(
                email=f"trader{i}@sher.com",
                mobile=f"+919999999{990-i:03d}",
                hashed_password=get_password_hash("password123"),
                first_name=f"Trader{i}",
                last_name="User",
                role=UserRole.TRADER,
                plan=random.choice([Plan.FREE, Plan.PRO, Plan.ELITE]),
                is_active=True,
                is_verified=True,
            ))

        for user in users:
            self.session.add(user)

        await self.session.flush()
        return users

    async def seed_portfolios(self) -> List[Portfolio]:
        """Seed portfolios for users"""
        users = await self.session.execute(
            "SELECT id FROM users WHERE role != 'ADMIN'"
        )
        user_ids = [u[0] for u in users.fetchall()]

        portfolios = []
        for user_id in user_ids:
            initial_capital = random.uniform(100000, 1000000)
            portfolio = Portfolio(
                user_id=user_id,
                name="Main Portfolio",
                initial_capital=initial_capital,
                current_capital=initial_capital * random.uniform(0.8, 1.3),
                available_capital=initial_capital * random.uniform(0.3, 0.7),
                invested_capital=initial_capital * random.uniform(0.3, 0.7),
                total_pnl=random.uniform(-50000, 150000),
                realized_pnl=random.uniform(-30000, 80000),
                unrealized_pnl=random.uniform(-20000, 70000),
                total_trades=random.randint(10, 200),
                winning_trades=random.randint(5, 100),
                losing_trades=random.randint(5, 100),
                win_rate=random.uniform(40, 70),
                risk_per_trade=2.0,
                max_positions=10,
            )
            portfolios.append(portfolio)
            self.session.add(portfolio)

        await self.session.flush()
        return portfolios

    async def seed_signals(self, count: int = 50) -> List[Signal]:
        """Seed trading signals"""
        users = await self.session.execute("SELECT id FROM users LIMIT 3")
        user_ids = [u[0] for u in users.fetchall()]

        symbols = [
            "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
            "SBIN", "TATAMOTORS", "AXISBANK", "WIPRO", "BHARTIARTL",
            "ITC", "KOTAKBANK", "LT", "HINDUNILVR", "MARUTI",
        ]

        signals = []
        for i in range(count):
            symbol = random.choice(symbols)
            entry_price = random.uniform(100, 3000)

            signal = Signal(
                user_id=random.choice(user_ids),
                trace_id=f"SIG-{datetime.utcnow().strftime('%Y%m%d')}-{i+1:05d}",
                symbol=symbol,
                exchange="NSE",
                action=random.choice([SignalAction.BUY, SignalAction.SELL]),
                direction=random.choice([SignalDirection.LONG, SignalDirection.SHORT]),
                status=random.choice(list(SignalStatus)),
                probability=random.uniform(0.55, 0.95),
                confidence=random.uniform(0.6, 0.95),
                confidence_level=random.choice(list(ConfidenceLevel)),
                risk_level=random.choice(list(RiskLevel)),
                market_regime=random.choice(list(MarketRegime)),
                entry_price=entry_price,
                stop_loss=entry_price * (0.95 if random.random() > 0.5 else 1.05),
                target_1=entry_price * (1.03 if random.random() > 0.5 else 0.97),
                target_2=entry_price * (1.05 if random.random() > 0.5 else 0.95),
                target_3=entry_price * (1.08 if random.random() > 0.5 else 0.92),
                strategy=random.choice(["VWAP", "RSI", "MOMENTUM", "ENSEMBLE"]),
                evidence_count=random.randint(3, 10),
                signal_time=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            )
            signals.append(signal)
            self.session.add(signal)

        await self.session.flush()
        return signals

    async def seed_orders(self, count: int = 30) -> List[Order]:
        """Seed orders"""
        users = await self.session.execute("SELECT id FROM users LIMIT 3")
        user_ids = [u[0] for u in users.fetchall()]

        signals = await self.session.execute("SELECT id FROM signals LIMIT 20")
        signal_ids = [s[0] for s in signals.fetchall()]

        symbols = [
            "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
            "SBIN", "TATAMOTORS", "AXISBANK", "WIPRO", "BHARTIARTL",
        ]

        orders = []
        for i in range(count):
            symbol = random.choice(symbols)
            quantity = random.choice([10, 25, 50, 100, 150, 200])

            order = Order(
                user_id=random.choice(user_ids),
                signal_id=random.choice(signal_ids) if random.random() > 0.3 else None,
                order_id=f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{i+1:05d}",
                symbol=symbol,
                exchange="NSE",
                side=random.choice([OrderSide.BUY, OrderSide.SELL]),
                order_type=random.choice([OrderType.MARKET, OrderType.LIMIT]),
                product_type=random.choice([ProductType.INTRADAY, ProductType.DELIVERY]),
                quantity=quantity,
                filled_quantity=quantity if random.random() > 0.2 else random.randint(0, quantity),
                pending_quantity=0 if random.random() > 0.2 else random.randint(1, quantity),
                price=random.uniform(100, 3000),
                average_price=random.uniform(100, 3000),
                status=random.choice(list(OrderStatus)),
                broker="ANGEL_ONE",
                order_time=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            )
            orders.append(order)
            self.session.add(order)

        await self.session.flush()
        return orders

    async def seed_positions(self, count: int = 15) -> List[Position]:
        """Seed positions"""
        users = await self.session.execute("SELECT id FROM users LIMIT 3")
        user_ids = [u[0] for u in users.fetchall()]

        symbols = [
            "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
            "SBIN", "TATAMOTORS", "AXISBANK", "WIPRO", "BHARTIARTL",
        ]

        positions = []
        for i in range(count):
            symbol = random.choice(symbols)
            entry_price = random.uniform(100, 3000)
            current_price = entry_price * random.uniform(0.9, 1.15)
            quantity = random.choice([10, 25, 50, 100])

            position = Position(
                user_id=random.choice(user_ids),
                symbol=symbol,
                exchange="NSE",
                side=random.choice([PositionSide.LONG, PositionSide.SHORT]),
                status=random.choice([PositionStatus.OPEN, PositionStatus.CLOSED]),
                quantity=quantity,
                open_quantity=quantity if random.random() > 0.3 else 0,
                closed_quantity=0 if random.random() > 0.3 else quantity,
                entry_price=entry_price,
                current_price=current_price,
                exit_price=current_price if random.random() > 0.3 else None,
                stop_loss=entry_price * 0.95,
                target=entry_price * 1.1,
                unrealized_pnl=(current_price - entry_price) * quantity,
                realized_pnl=random.uniform(-5000, 15000) if random.random() > 0.3 else 0,
                entry_time=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                broker="ANGEL_ONE",
            )
            positions.append(position)
            self.session.add(position)

        await self.session.flush()
        return positions


async def run_seed():
    """Run database seeding"""
    async with async_session_maker() as session:
        seeder = DatabaseSeeder(session)
        results = await seeder.seed_all()
        await session.commit()

        print("Database seeded successfully!")
        for key, value in results.items():
            print(f"  - {key}: {len(value)} records")


if __name__ == "__main__":
    asyncio.run(run_seed())
