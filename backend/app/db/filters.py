"""
Database Filters
Common filter patterns for queries
"""

from typing import Any, Callable, Dict, List, Optional
from datetime import datetime, date
from enum import Enum

from sqlalchemy import and_, or_, not_, func
from sqlalchemy.sql import Select


class FilterOperator(str, Enum):
    """Filter operators"""
    EQ = "eq"
    NE = "ne"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    LIKE = "like"
    ILIKE = "ilike"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"
    BETWEEN = "between"


def apply_filters(
    query: Select,
    model: Any,
    filters: Dict[str, Any]
) -> Select:
    """
    Apply filters to a SQLAlchemy query.

    Args:
        query: SQLAlchemy select query
        model: SQLAlchemy model class
        filters: Dictionary of filters

    Returns:
        Modified query with filters applied

    Example:
        filters = {
            "status": {"eq": "ACTIVE"},
            "price": {"gte": 100, "lte": 500},
            "name": {"ilike": "test"},
        }
    """
    conditions = []

    for field_name, filter_ops in filters.items():
        if not hasattr(model, field_name):
            continue

        field = getattr(model, field_name)

        for operator, value in filter_ops.items():
            op = FilterOperator(operator)
            condition = _build_condition(field, op, value)
            if condition is not None:
                conditions.append(condition)

    if conditions:
        query = query.where(and_(*conditions))

    return query


def _build_condition(field: Any, operator: FilterOperator, value: Any) -> Any:
    """Build a filter condition"""
    operators = {
        FilterOperator.EQ: lambda f, v: f == v,
        FilterOperator.NE: lambda f, v: f != v,
        FilterOperator.GT: lambda f, v: f > v,
        FilterOperator.GTE: lambda f, v: f >= v,
        FilterOperator.LT: lambda f, v: f < v,
        FilterOperator.LTE: lambda f, v: f <= v,
        FilterOperator.LIKE: lambda f, v: f.like(f"%{v}%"),
        FilterOperator.ILIKE: lambda f, v: f.ilike(f"%{v}%"),
        FilterOperator.IN: lambda f, v: f.in_(v if isinstance(v, list) else v.split(",")),
        FilterOperator.NOT_IN: lambda f, v: ~f.in_(v if isinstance(v, list) else v.split(",")),
        FilterOperator.IS_NULL: lambda f, v: f.is_(None),
        FilterOperator.IS_NOT_NULL: lambda f, v: f.isnot(None),
        FilterOperator.BETWEEN: lambda f, v: f.between(v[0], v[1]) if isinstance(v, (list, tuple)) else None,
    }

    if operator in operators:
        return operators[operator](field, value)
    return None


def apply_search(
    query: Select,
    model: Any,
    search_fields: List[str],
    search_term: str
) -> Select:
    """
    Apply full-text search across multiple fields.

    Args:
        query: SQLAlchemy select query
        model: SQLAlchemy model class
        search_fields: List of field names to search
        search_term: Search term

    Returns:
        Modified query with search applied
    """
    conditions = []

    for field_name in search_fields:
        if hasattr(model, field_name):
            field = getattr(model, field_name)
            conditions.append(field.ilike(f"%{search_term}%"))

    if conditions:
        query = query.where(or_(*conditions))

    return query


def apply_date_range(
    query: Select,
    field: Any,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Select:
    """
    Apply date range filter.

    Args:
        query: SQLAlchemy select query
        field: SQLAlchemy column
        start_date: Start date (inclusive)
        end_date: End date (inclusive)

    Returns:
        Modified query with date range applied
    """
    conditions = []

    if start_date:
        conditions.append(field >= start_date)
    if end_date:
        conditions.append(field <= end_date)

    if conditions:
        query = query.where(and_(*conditions))

    return query


def apply_sorting(
    query: Select,
    model: Any,
    sort_by: str,
    sort_order: str = "desc"
) -> Select:
    """
    Apply sorting to query.

    Args:
        query: SQLAlchemy select query
        model: SQLAlchemy model class
        sort_by: Field name to sort by
        sort_order: Sort order ('asc' or 'desc')

    Returns:
        Modified query with sorting applied
    """
    if not hasattr(model, sort_by):
        return query

    field = getattr(model, sort_by)

    if sort_order.lower() == "desc":
        query = query.order_by(field.desc())
    else:
        query = query.order_by(field.asc())

    return query


def apply_pagination(
    query: Select,
    page: int = 1,
    per_page: int = 20
) -> Select:
    """
    Apply pagination to query.

    Args:
        query: SQLAlchemy select query
        page: Page number (1-indexed)
        per_page: Items per page

    Returns:
        Modified query with pagination applied
    """
    offset = (page - 1) * per_page
    return query.offset(offset).limit(per_page)


class QueryBuilder:
    """Fluent query builder for complex queries"""

    def __init__(self, model: Any, query: Select = None):
        """
        Initialize query builder.

        Args:
            model: SQLAlchemy model class
            query: Optional existing query
        """
        self.model = model
        self.query = query or select(model)

    def filter(self, **kwargs) -> "QueryBuilder":
        """Add filters"""
        self.query = apply_filters(self.query, self.model, kwargs)
        return self

    def search(self, fields: List[str], term: str) -> "QueryBuilder":
        """Add search"""
        self.query = apply_search(self.query, self.model, fields, term)
        return self

    def date_range(
        self,
        field: str,
        start: datetime = None,
        end: datetime = None
    ) -> "QueryBuilder":
        """Add date range filter"""
        if hasattr(self.model, field):
            self.query = apply_date_range(
                self.query,
                getattr(self.model, field),
                start,
                end
            )
        return self

    def sort(self, field: str, order: str = "desc") -> "QueryBuilder":
        """Add sorting"""
        self.query = apply_sorting(self.query, self.model, field, order)
        return self

    def paginate(self, page: int = 1, per_page: int = 20) -> "QueryBuilder":
        """Add pagination"""
        self.query = apply_pagination(self.query, page, per_page)
        return self

    def build(self) -> Select:
        """Build and return the query"""
        return self.query


# Common filter presets
class CommonFilters:
    """Common filter presets for trading data"""

    @staticmethod
    def active_only(model: Any) -> Dict[str, Any]:
        """Filter for active records"""
        return {"status": {"eq": "ACTIVE"}}

    @staticmethod
    def today_only(model: Any, field: str = "created_at") -> Dict[str, Any]:
        """Filter for today's records"""
        today = date.today()
        return {
            field: {
                "gte": datetime.combine(today, datetime.min.time()),
                "lte": datetime.combine(today, datetime.max.time())
            }
        }

    @staticmethod
    def this_week(model: Any, field: str = "created_at") -> Dict[str, Any]:
        """Filter for this week's records"""
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        return {
            field: {
                "gte": datetime.combine(start_of_week, datetime.min.time())
            }
        }

    @staticmethod
    def this_month(model: Any, field: str = "created_at") -> Dict[str, Any]:
        """Filter for this month's records"""
        today = date.today()
        start_of_month = today.replace(day=1)
        return {
            field: {
                "gte": datetime.combine(start_of_month, datetime.min.time())
            }
        }
