"""
Base Repository
Generic repository with CRUD operations
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from datetime import datetime

from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Base repository with common CRUD operations.
    All specific repositories should inherit from this class.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def create(self, data: Dict[str, Any]) -> ModelType:
        """Create a new record"""
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def get_by_id(self, id: int, load_relations: List[str] = None) -> Optional[ModelType]:
        """Get a record by ID"""
        query = select(self.model).where(self.model.id == id)
        if load_relations:
            for relation in load_relations:
                query = query.options(selectinload(getattr(self.model, relation)))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_field(
        self,
        field: str,
        value: Any,
        load_relations: List[str] = None
    ) -> Optional[ModelType]:
        """Get a record by a specific field"""
        query = select(self.model).where(getattr(self.model, field) == value)
        if load_relations:
            for relation in load_relations:
                query = query.options(selectinload(getattr(self.model, relation)))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: str = None,
        order_desc: bool = False,
        load_relations: List[str] = None
    ) -> List[ModelType]:
        """Get all records with pagination"""
        query = select(self.model)

        if load_relations:
            for relation in load_relations:
                query = query.options(selectinload(getattr(self.model, relation)))

        if order_by:
            order_column = getattr(self.model, order_by)
            query = query.order_by(order_column.desc() if order_desc else order_column)

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_multi_by_field(
        self,
        field: str,
        value: Any,
        skip: int = 0,
        limit: int = 100,
        load_relations: List[str] = None
    ) -> List[ModelType]:
        """Get multiple records by a specific field"""
        query = select(self.model).where(getattr(self.model, field) == value)

        if load_relations:
            for relation in load_relations:
                query = query.options(selectinload(getattr(self.model, relation)))

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, id: int, data: Dict[str, Any]) -> Optional[ModelType]:
        """Update a record by ID"""
        instance = await self.get_by_id(id)
        if instance:
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            await self.session.flush()
            await self.session.refresh(instance)
        return instance

    async def update_by_field(
        self,
        field: str,
        value: Any,
        data: Dict[str, Any]
    ) -> int:
        """Update records by a specific field"""
        query = (
            update(self.model)
            .where(getattr(self.model, field) == value)
            .values(**data)
            .returning(self.model.id)
        )
        result = await self.session.execute(query)
        return len(result.all())

    async def delete(self, id: int) -> bool:
        """Delete a record by ID"""
        instance = await self.get_by_id(id)
        if instance:
            await self.session.delete(instance)
            await self.session.flush()
            return True
        return False

    async def delete_by_field(self, field: str, value: Any) -> int:
        """Delete records by a specific field"""
        query = delete(self.model).where(getattr(self.model, field) == value)
        result = await self.session.execute(query)
        return result.rowcount

    async def count(self, filters: Dict[str, Any] = None) -> int:
        """Count records with optional filters"""
        query = select(func.count(self.model.id))
        if filters:
            conditions = [
                getattr(self.model, k) == v
                for k, v in filters.items()
                if hasattr(self.model, k)
            ]
            if conditions:
                query = query.where(and_(*conditions))
        result = await self.session.execute(query)
        return result.scalar_one()

    async def exists(self, id: int) -> bool:
        """Check if a record exists"""
        query = select(func.exists(select(1).where(self.model.id == id)))
        result = await self.session.execute(query)
        return result.scalar_one()

    async def search(
        self,
        search_fields: List[str],
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Search records by multiple fields"""
        conditions = [
            getattr(self.model, field).ilike(f"%{search_term}%")
            for field in search_fields
            if hasattr(self.model, field)
        ]
        query = select(self.model).where(or_(*conditions)).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def filter(
        self,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        order_by: str = None,
        order_desc: bool = False,
        load_relations: List[str] = None
    ) -> List[ModelType]:
        """Filter records by multiple criteria"""
        query = select(self.model)

        conditions = []
        for key, value in filters.items():
            if hasattr(self.model, key):
                if isinstance(value, (list, tuple)):
                    conditions.append(getattr(self.model, key).in_(value))
                elif isinstance(value, dict):
                    # Handle operators like {'gt': 10}, {'lt': 20}, {'like': '%term%'}
                    for op, val in value.items():
                        column = getattr(self.model, key)
                        if op == 'gt':
                            conditions.append(column > val)
                        elif op == 'gte':
                            conditions.append(column >= val)
                        elif op == 'lt':
                            conditions.append(column < val)
                        elif op == 'lte':
                            conditions.append(column <= val)
                        elif op == 'like':
                            conditions.append(column.like(val))
                        elif op == 'ilike':
                            conditions.append(column.ilike(val))
                else:
                    conditions.append(getattr(self.model, key) == value)

        if conditions:
            query = query.where(and_(*conditions))

        if load_relations:
            for relation in load_relations:
                query = query.options(selectinload(getattr(self.model, relation)))

        if order_by:
            order_column = getattr(self.model, order_by)
            query = query.order_by(order_column.desc() if order_desc else order_column)

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_date_range(
        self,
        date_field: str,
        start_date: datetime,
        end_date: datetime,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Get records within a date range"""
        column = getattr(self.model, date_field)
        query = (
            select(self.model)
            .where(and_(column >= start_date, column <= end_date))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def bulk_create(self, data_list: List[Dict[str, Any]]) -> List[ModelType]:
        """Create multiple records"""
        instances = [self.model(**data) for data in data_list]
        self.session.add_all(instances)
        await self.session.flush()
        for instance in instances:
            await self.session.refresh(instance)
        return instances

    async def bulk_update(self, updates: List[Dict[str, Any]]) -> int:
        """Update multiple records. Each dict must contain 'id' key."""
        count = 0
        for update_data in updates:
            if 'id' in update_data:
                id_value = update_data.pop('id')
                if await self.update(id_value, update_data):
                    count += 1
        return count
