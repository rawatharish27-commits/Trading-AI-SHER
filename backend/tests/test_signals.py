"""
Signal Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_generate_signal(client: AsyncClient):
    """Test signal generation"""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "signal@example.com",
            "mobile": "9876543240",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "signal@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Generate signal
    response = await client.post(
        "/api/v1/signals/generate?symbol=RELIANCE&exchange=NSE",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "symbol" in data
    assert "probability" in data
    assert "action" in data


@pytest.mark.asyncio
async def test_get_signals(client: AsyncClient):
    """Test getting signals list"""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "signals@example.com",
            "mobile": "9876543241",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "signals@example.com", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    
    # Get signals
    response = await client.get(
        "/api/v1/signals/",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "signals" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_market_quote(client: AsyncClient):
    """Test getting market quote"""
    response = await client.get("/api/v1/market/quote/RELIANCE")
    
    assert response.status_code == 200
    data = response.json()
    assert "symbol" in data
    assert "ltp" in data


@pytest.mark.asyncio
async def test_market_status(client: AsyncClient):
    """Test getting market status"""
    response = await client.get("/api/v1/market/status")
    
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint"""
    response = await client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
