"""
User Repository
User-specific database operations
"""

from typing import List, Optional
from datetime import datetime

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.repositories.base import BaseRepository
from app.models.user import User, UserRole, Plan


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""

    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return await self.get_by_field("email", email)

    async def get_by_mobile(self, mobile: str) -> Optional[User]:
        """Get user by mobile number"""
        return await self.get_by_field("mobile", mobile)

    async def get_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users"""
        return await self.filter(
            {"is_active": True},
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_users_by_role(
        self,
        role: UserRole,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get users by role"""
        return await self.filter(
            {"role": role},
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_users_by_plan(
        self,
        plan: Plan,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get users by subscription plan"""
        return await self.filter(
            {"plan": plan},
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def get_premium_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users with premium plans (PRO, ELITE, INSTITUTIONAL)"""
        query = (
            select(User)
            .where(User.plan.in_([Plan.PRO, Plan.ELITE, Plan.INSTITUTIONAL]))
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_tenant_users(
        self,
        tenant_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get users belonging to a tenant"""
        return await self.filter(
            {"tenant_id": tenant_id},
            skip=skip,
            limit=limit,
            order_by="created_at",
            order_desc=True
        )

    async def update_last_login(self, user_id: int) -> Optional[User]:
        """Update user's last login timestamp"""
        return await self.update(user_id, {"last_login": datetime.utcnow()})

    async def verify_user(self, user_id: int) -> Optional[User]:
        """Mark user as verified"""
        return await self.update(user_id, {"is_verified": True})

    async def activate_user(self, user_id: int) -> Optional[User]:
        """Activate user account"""
        return await self.update(user_id, {"is_active": True})

    async def deactivate_user(self, user_id: int) -> Optional[User]:
        """Deactivate user account"""
        return await self.update(user_id, {"is_active": False})

    async def upgrade_plan(self, user_id: int, plan: Plan) -> Optional[User]:
        """Upgrade user's plan"""
        return await self.update(user_id, {"plan": plan})

    async def enable_mfa(self, user_id: int, mfa_secret: str) -> Optional[User]:
        """Enable MFA for user"""
        return await self.update(user_id, {
            "mfa_enabled": True,
            "mfa_secret": mfa_secret
        })

    async def disable_mfa(self, user_id: int) -> Optional[User]:
        """Disable MFA for user"""
        return await self.update(user_id, {
            "mfa_enabled": False,
            "mfa_secret": None
        })

    async def complete_onboarding(self, user_id: int) -> Optional[User]:
        """Mark user onboarding as complete"""
        return await self.update(user_id, {"onboarding_completed": True})

    async def search_users(
        self,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Search users by email, name, or mobile"""
        return await self.search(
            search_fields=["email", "first_name", "last_name", "mobile"],
            search_term=search_term,
            skip=skip,
            limit=limit
        )

    async def get_users_with_expired_plans(self) -> List[User]:
        """Get users whose plans have expired"""
        query = (
            select(User)
            .where(
                and_(
                    User.plan_expiry.isnot(None),
                    User.plan_expiry < datetime.utcnow()
                )
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count_active_users(self) -> int:
        """Count active users"""
        return await self.count({"is_active": True})

    async def count_users_by_plan(self, plan: Plan) -> int:
        """Count users by plan"""
        return await self.count({"plan": plan})
