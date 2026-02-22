"""
Database Utilities
Pagination, filtering, and other helpers
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from dataclasses import dataclass

T = TypeVar("T")


@dataclass
class PaginationParams:
    """Pagination parameters"""
    page: int = 1
    per_page: int = 20
    max_per_page: int = 100

    def __post_init__(self):
        """Validate pagination parameters"""
        if self.page < 1:
            self.page = 1
        if self.per_page < 1:
            self.per_page = 20
        if self.per_page > self.max_per_page:
            self.per_page = self.max_per_page

    @property
    def offset(self) -> int:
        """Calculate offset for database query"""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Get limit for database query"""
        return self.per_page


@dataclass
class PaginatedResult(Generic[T]):
    """Paginated result container"""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        pagination: PaginationParams
    ) -> "PaginatedResult[T]":
        """Create paginated result"""
        pages = (total + pagination.per_page - 1) // pagination.per_page
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            per_page=pagination.per_page,
            pages=pages,
            has_next=pagination.page < pages,
            has_prev=pagination.page > 1
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "per_page": self.per_page,
            "pages": self.pages,
            "has_next": self.has_next,
            "has_prev": self.has_prev,
        }


class SortParams:
    """Sorting parameters"""

    def __init__(
        self,
        sort_by: str = None,
        sort_order: str = "desc"
    ):
        """
        Initialize sort parameters.

        Args:
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
        """
        self.sort_by = sort_by
        self.sort_order = sort_order.lower() if sort_order else "desc"

        if self.sort_order not in ["asc", "desc"]:
            self.sort_order = "desc"

    @property
    def is_desc(self) -> bool:
        """Check if sorting in descending order"""
        return self.sort_order == "desc"


class FilterBuilder:
    """Build database filters from query parameters"""

    OPERATORS = {
        "eq": lambda field, value: field == value,
        "ne": lambda field, value: field != value,
        "gt": lambda field, value: field > value,
        "gte": lambda field, value: field >= value,
        "lt": lambda field, value: field < value,
        "lte": lambda field, value: field <= value,
        "like": lambda field, value: field.like(f"%{value}%"),
        "ilike": lambda field, value: field.ilike(f"%{value}%"),
        "in": lambda field, value: field.in_(value.split(",")),
        "is_null": lambda field, value: field.is_(None),
        "is_not_null": lambda field, value: field.isnot(None),
    }

    def __init__(self):
        self.filters: List[Any] = []

    def add_filter(
        self,
        field: Any,
        operator: str,
        value: Any
    ) -> "FilterBuilder":
        """
        Add a filter condition.

        Args:
            field: SQLAlchemy column
            operator: Filter operator (eq, ne, gt, lt, like, etc.)
            value: Filter value

        Returns:
            Self for chaining
        """
        if operator in self.OPERATORS:
            condition = self.OPERATORS[operator](field, value)
            self.filters.append(condition)
        return self

    def add_range_filter(
        self,
        field: Any,
        min_value: Any = None,
        max_value: Any = None
    ) -> "FilterBuilder":
        """Add a range filter (between min and max)"""
        if min_value is not None:
            self.filters.append(field >= min_value)
        if max_value is not None:
            self.filters.append(field <= max_value)
        return self

    def add_date_range_filter(
        self,
        field: Any,
        start_date: Any = None,
        end_date: Any = None
    ) -> "FilterBuilder":
        """Add a date range filter"""
        return self.add_range_filter(field, start_date, end_date)

    def add_search_filter(
        self,
        fields: List[Any],
        search_term: str
    ) -> "FilterBuilder":
        """Add a search filter across multiple fields"""
        from sqlalchemy import or_

        conditions = [
            field.ilike(f"%{search_term}%")
            for field in fields
        ]
        if conditions:
            self.filters.append(or_(*conditions))
        return self

    def build(self) -> List[Any]:
        """Build and return all filter conditions"""
        return self.filters

    def clear(self) -> None:
        """Clear all filters"""
        self.filters = []


def parse_query_params(
    query_params: Dict[str, Any],
    allowed_filters: Dict[str, str] = None
) -> Dict[str, Any]:
    """
    Parse query parameters into filters.

    Args:
        query_params: Raw query parameters
        allowed_filters: Mapping of param names to filter operators

    Returns:
        Dictionary of parsed filters

    Example:
        allowed_filters = {
            "status": "eq",
            "min_price": "gte:price",
            "max_price": "lte:price",
            "search": "search:name,description",
        }
    """
    filters = {}
    allowed_filters = allowed_filters or {}

    for param, value in query_params.items():
        if param in allowed_filters:
            filter_spec = allowed_filters[param]

            if ":" in filter_spec:
                operator, field = filter_spec.split(":", 1)
            else:
                operator = filter_spec
                field = param

            if operator == "search":
                filters["search"] = {
                    "fields": field.split(","),
                    "term": value
                }
            else:
                if field not in filters:
                    filters[field] = {}
                filters[field][operator] = value

    return filters
