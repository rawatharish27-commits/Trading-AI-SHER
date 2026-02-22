"""
Simple Admin Authentication
Single password login for admin only
"""

from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.admin_config import (
    admin_settings,
    create_admin_token,
    verify_admin_token,
)

router = APIRouter()
security = HTTPBearer()


# ==================== SCHEMAS ====================

class AdminLogin(BaseModel):
    """Admin login request"""
    password: str


class AdminToken(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class AdminInfo(BaseModel):
    """Admin info response"""
    username: str = "admin"
    role: str = "ADMIN"
    login_time: datetime
    session_expires: datetime


class PasswordChange(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str


# ==================== DEPENDENCIES ====================

async def get_admin_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    """Verify admin token - dependency for protected routes"""
    token = credentials.credentials
    
    payload = verify_admin_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


# ==================== ENDPOINTS ====================

@router.post("/login", response_model=AdminToken)
async def admin_login(
    credentials: AdminLogin
):
    """
    Admin login with password only
    
    Default password: admin123 (CHANGE IN PRODUCTION!)
    Set ADMIN_PASSWORD environment variable for custom password
    """
    # Verify password
    if not admin_settings.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )
    
    # Create token
    token = create_admin_token()
    
    return AdminToken(
        access_token=token,
        token_type="bearer",
        expires_in=admin_settings.jwt_expire_hours * 3600,
    )


@router.get("/me", response_model=AdminInfo)
async def get_admin_info(
    admin: Annotated[dict, Depends(get_admin_user)]
):
    """Get current admin info"""
    from datetime import timedelta
    
    now = datetime.utcnow()
    
    return AdminInfo(
        username="admin",
        role="ADMIN",
        login_time=now,
        session_expires=now + timedelta(hours=admin_settings.jwt_expire_hours),
    )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    admin: Annotated[dict, Depends(get_admin_user)]
):
    """
    Change admin password
    
    Note: In production, you need to update the ADMIN_PASSWORD
    environment variable or configuration file
    """
    # Verify current password
    if not admin_settings.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Update password
    admin_settings.change_password(password_data.new_password)
    
    return {
        "message": "Password changed successfully. Please login again with new password.",
        "note": "In production, update ADMIN_PASSWORD environment variable"
    }


@router.post("/logout")
async def admin_logout(
    admin: Annotated[dict, Depends(get_admin_user)]
):
    """Logout admin (client should discard token)"""
    return {"message": "Logged out successfully"}


@router.post("/verify")
async def verify_token(
    admin: Annotated[dict, Depends(get_admin_user)]
):
    """Verify if token is still valid"""
    return {
        "valid": True,
        "admin": admin.get("sub"),
        "role": admin.get("role"),
    }


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def auth_health():
    """Auth service health check"""
    return {
        "status": "ok",
        "service": "admin-auth",
        "default_password_hint": "Default: admin123 (change via ADMIN_PASSWORD env)"
    }
