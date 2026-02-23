"""
Integration Tests for SMC Agent
End-to-end testing of SMC signal generation and persistence
"""

import pytest
import pandas as pd
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.models import Signal, User
from app.engines.smc_engine import SMCSetup, MarketStructure


class TestSMCIntegration:
    """Integration tests for SMC signal generation and persistence"""

    @pytest.mark.asyncio
    async def test_smc_signal_generation_full_flow(self, client: AsyncClient, db_session: AsyncSession):
        """Test complete SMC signal generation flow from API to database"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_integration@example.com",
                "mobile": "9876543210",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_integration@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Mock market data service to return valid data
        with patch('app.services.market_data_service.market_data_service.get_ohlcv') as mock_get_ohlcv, \
             patch('app.engines.smc_engine.smc_engine.analyze_symbol') as mock_analyze:

            # Setup mock data
            mock_data = pd.DataFrame({
                'timestamp': pd.date_range('2024-01-01', periods=150, freq='15min'),
                'open': [100 + i * 0.1 for i in range(150)],
                'high': [102 + i * 0.1 for i in range(150)],
                'low': [98 + i * 0.1 for i in range(150)],
                'close': [101 + i * 0.1 for i in range(150)],
                'volume': [10000] * 150
            }).set_index('timestamp')

            mock_get_ohlcv.side_effect = [mock_data, mock_data]  # LTF and HTF data

            # Mock SMC analysis to return a valid BUY setup
            mock_setup = SMCSetup(
                direction="BUY",
                entry_price=101.0,
                stop_loss=99.0,
                target_price=106.0,
                risk_reward_ratio=2.5,
                structure_bias=MarketStructure.BULLISH,
                liquidity_sweep=None,
                order_block=None,
                fvg=None,
                mtf_confirmation=True,
                quality_score=0.85,
                confidence="HIGH",
                timestamp=pd.Timestamp.utcnow()
            )
            mock_analyze.return_value = mock_setup

            # Generate signal via API
            response = await client.post(
                "/api/v1/signals/generate?symbol=RELIANCE&exchange=NSE&ltf_timeframe=15m&htf_timeframe=1h",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == 200
            signal_data = response.json()

            # Verify signal structure
            assert signal_data["symbol"] == "RELIANCE"
            assert signal_data["exchange"] == "NSE"
            assert signal_data["strategy"] == "SMC"
            assert signal_data["action"] == "BUY"
            assert signal_data["direction"] == "BUY"
            assert signal_data["entry_price"] == 101.0
            assert signal_data["stop_loss"] == 99.0
            assert signal_data["target_price"] == 106.0
            assert signal_data["quality_score"] == 0.85
            assert signal_data["confidence"] == "HIGH"
            assert signal_data["approved"] is True

            # Verify database persistence
            signal_id = signal_data["id"]
            db_signal = await db_session.get(Signal, signal_id)
            assert db_signal is not None
            assert db_signal.symbol == "RELIANCE"
            assert db_signal.action.value == "BUY"
            assert db_signal.strategy == "SMC"
            assert db_signal.entry_price == 101.0
            assert db_signal.stop_loss == 99.0
            assert db_signal.target_1 == 106.0
            assert db_signal.probability == 0.85

    @pytest.mark.asyncio
    async def test_smc_signal_hold_scenario(self, client: AsyncClient, db_session: AsyncSession):
        """Test SMC signal generation when no valid setup is found"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_hold@example.com",
                "mobile": "9876543211",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_hold@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Mock market data service to return valid data but SMC analysis returns None
        with patch('app.services.market_data_service.market_data_service.get_ohlcv') as mock_get_ohlcv, \
             patch('app.engines.smc_engine.smc_engine.analyze_symbol') as mock_analyze:

            mock_data = pd.DataFrame({
                'timestamp': pd.date_range('2024-01-01', periods=150, freq='15min'),
                'open': [100] * 150,
                'high': [100] * 150,
                'low': [100] * 150,
                'close': [100] * 150,
                'volume': [10000] * 150
            }).set_index('timestamp')

            mock_get_ohlcv.side_effect = [mock_data, mock_data]
            mock_analyze.return_value = None  # No setup found

            # Generate signal via API
            response = await client.post(
                "/api/v1/signals/generate?symbol=TCS&exchange=NSE",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == 400
            error_data = response.json()
            assert "No valid SMC setup found" in error_data["detail"]

    @pytest.mark.asyncio
    async def test_smc_signal_list_and_retrieval(self, client: AsyncClient, db_session: AsyncSession):
        """Test SMC signal listing and individual retrieval"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_list@example.com",
                "mobile": "9876543212",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_list@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Create a signal directly in database for testing
        user_result = await db_session.execute(
            "SELECT id FROM users WHERE email = 'smc_list@example.com'"
        )
        user_id = user_result.scalar()

        test_signal = Signal(
            user_id=user_id,
            trace_id="test_trace_123",
            symbol="INFY",
            exchange="NSE",
            action="BUY",
            direction="BUY",
            status="ACTIVE",
            probability=0.8,
            confidence=0.8,
            confidence_level="HIGH",
            risk_level="LOW",
            entry_price=1500.0,
            stop_loss=1470.0,
            target_1=1575.0,
            target_2=1650.0,
            target_3=1725.0,
            strategy="SMC",
            market_regime="TRENDING",
            setup_version="1.0",
            market_structure="BULLISH",
            liquidity_sweep="SWEEP",
            order_block="BULLISH",
            fair_value_gap="BULLISH",
            mtf_confirmation=True,
            evidence_count=1,
            reasoning="SMC Bullish Setup",
            signal_time=pd.Timestamp.utcnow()
        )

        db_session.add(test_signal)
        await db_session.commit()
        await db_session.refresh(test_signal)

        # Test signal listing
        response = await client.get(
            "/api/v1/signals/",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        signals_data = response.json()
        assert signals_data["total"] >= 1
        assert len(signals_data["signals"]) >= 1

        # Find our test signal
        test_signal_data = None
        for signal in signals_data["signals"]:
            if signal["symbol"] == "INFY":
                test_signal_data = signal
                break

        assert test_signal_data is not None
        assert test_signal_data["strategy"] == "SMC"
        assert test_signal_data["action"] == "BUY"
        assert test_signal_data["market_structure"] == "BULLISH"

        # Test individual signal retrieval
        response = await client.get(
            f"/api/v1/signals/{test_signal.id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        signal_detail = response.json()
        assert signal_detail["symbol"] == "INFY"
        assert signal_detail["strategy"] == "SMC"
        assert signal_detail["liquidity_sweep"] == "SWEEP"

    @pytest.mark.asyncio
    async def test_smc_signal_cancellation(self, client: AsyncClient, db_session: AsyncSession):
        """Test SMC signal cancellation"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_cancel@example.com",
                "mobile": "9876543213",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_cancel@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Create a signal directly in database
        user_result = await db_session.execute(
            "SELECT id FROM users WHERE email = 'smc_cancel@example.com'"
        )
        user_id = user_result.scalar()

        test_signal = Signal(
            user_id=user_id,
            trace_id="cancel_test_123",
            symbol="WIPRO",
            exchange="NSE",
            action="SELL",
            direction="SELL",
            status="ACTIVE",
            probability=0.75,
            strategy="SMC",
            entry_price=400.0,
            stop_loss=410.0,
            target_1=385.0,
            signal_time=pd.Timestamp.utcnow()
        )

        db_session.add(test_signal)
        await db_session.commit()
        await db_session.refresh(test_signal)

        # Cancel the signal
        response = await client.post(
            f"/api/v1/signals/{test_signal.id}/cancel",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        cancel_data = response.json()
        assert cancel_data["message"] == "Signal cancelled"
        assert cancel_data["signal_id"] == test_signal.id

        # Verify signal was cancelled in database
        cancelled_signal = await db_session.get(Signal, test_signal.id)
        assert cancelled_signal.status.value == "CANCELLED"

    @pytest.mark.asyncio
    async def test_smc_signal_filtering(self, client: AsyncClient, db_session: AsyncSession):
        """Test SMC signal filtering by symbol and action"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_filter@example.com",
                "mobile": "9876543214",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_filter@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Create multiple signals
        user_result = await db_session.execute(
            "SELECT id FROM users WHERE email = 'smc_filter@example.com'"
        )
        user_id = user_result.scalar()

        signals_data = [
            ("RELIANCE", "BUY", "ACTIVE"),
            ("TCS", "SELL", "ACTIVE"),
            ("INFY", "BUY", "CANCELLED"),
            ("RELIANCE", "SELL", "ACTIVE")
        ]

        for symbol, action, status in signals_data:
            signal = Signal(
                user_id=user_id,
                trace_id=f"filter_test_{symbol}",
                symbol=symbol,
                exchange="NSE",
                action=action,
                direction=action,
                status=status,
                probability=0.8,
                strategy="SMC",
                entry_price=100.0,
                signal_time=pd.Timestamp.utcnow()
            )
            db_session.add(signal)

        await db_session.commit()

        # Test filtering by symbol
        response = await client.get(
            "/api/v1/signals/?symbol=RELIANCE",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        for signal in data["signals"]:
            assert signal["symbol"] == "RELIANCE"

        # Test filtering by action
        response = await client.get(
            "/api/v1/signals/?action=BUY",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        for signal in data["signals"]:
            assert signal["action"] == "BUY"

        # Test filtering by status
        response = await client.get(
            "/api/v1/signals/?status=ACTIVE",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        for signal in data["signals"]:
            assert signal["status"] == "ACTIVE"

    @pytest.mark.asyncio
    async def test_smc_signal_pagination(self, client: AsyncClient, db_session: AsyncSession):
        """Test SMC signal pagination"""
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "smc_pagination@example.com",
                "mobile": "9876543215",
                "password": "password123",
                "confirm_password": "password123"
            }
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "smc_pagination@example.com", "password": "password123"}
        )
        token = login_response.json()["access_token"]

        # Create multiple signals
        user_result = await db_session.execute(
            "SELECT id FROM users WHERE email = 'smc_pagination@example.com'"
        )
        user_id = user_result.scalar()

        # Create 5 signals
        for i in range(5):
            signal = Signal(
                user_id=user_id,
                trace_id=f"pagination_test_{i}",
                symbol=f"SYMBOL{i}",
                exchange="NSE",
                action="BUY",
                direction="BUY",
                status="ACTIVE",
                probability=0.8,
                strategy="SMC",
                entry_price=100.0 + i,
                signal_time=pd.Timestamp.utcnow()
            )
            db_session.add(signal)

        await db_session.commit()

        # Test pagination - page 1, page_size 2
        response = await client.get(
            "/api/v1/signals/?page=1&page_size=2",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["signals"]) == 2
        assert data["total"] == 5

        # Test pagination - page 2, page_size 2
        response = await client.get(
            "/api/v1/signals/?page=2&page_size=2",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["page_size"] == 2
        assert len(data["signals"]) == 2
        assert data["total"] == 5

        # Test pagination - page 3, page_size 2 (should have 1 signal)
        response = await client.get(
            "/api/v1/signals/?page=3&page_size=2",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 3
        assert data["page_size"] == 2
        assert len(data["signals"]) == 1
        assert data["total"] == 5
