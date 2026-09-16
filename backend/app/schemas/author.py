from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import BookStatus
from app.schemas.book import BookResponse


class BookAnalytics(BaseModel):
    book_id: UUID
    title: str
    price: Decimal
    status: BookStatus
    total_purchases: int
    total_revenue: Decimal
    shelf_saves_count: int


class AuthorDashboardStats(BaseModel):
    total_books: int
    total_readers: int
    total_revenue: Decimal
    books: List[BookAnalytics]