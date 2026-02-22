"""
Authentication Tests
"""

import pytest
from httpx import AsyncClient

from app.core import get_password_hash
from app.models import User, UserRole, Plan


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "mobile": "9876543210",
            "password": "testpassword123",
            "confirm_password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["mobile"] == "9876543210"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration with duplicate email"""
    # First registration
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test2@example.com",
            "mobile": "9876543211",
            "password": "testpassword123",
            "confirm_password": "testpassword123"
        }
    )
    
    # Second registration with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test2@example.com",
            "mobile": "9876543212",
            "password": "testpassword123",
            "confirm_password": "testpassword123"
        }
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login(client: AsyncClient, db_session):
    """Test user login"""
    # Create user
    from app.core.database import async_session_maker
    
    async with async_session_maker() as session:
        user = User(
            email="login@example.com",
            mobile="9876543220",
            hashed_password=get_password_hash("password123"),
            role=UserRole.TRADER,
            plan=Plan.FREE,
            is_active=True
        )
        session.add(user)
        await session.commit()
    
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "password123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Test login with invalid password"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, db_session):
    """Test getting current user profile"""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile@example.com",
            "mobile": "9876543230",
            "password": "password123",
            "confirm_password": "password123"
        }
    )
    
    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "profile@example.com",
            "password": "password123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Get profile
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test accessing protected route without token"""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 403
