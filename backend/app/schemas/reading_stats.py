from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ReadingPing(BaseModel):
    book_id: UUID
    duration_seconds: int = 60


class RecentlyReadBook(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id: UUID
    title: str
    author_name: str
    cover_image_url: Optional[str] = None
    last_read_at: datetime
    total_minutes: int


class ReaderStatsResponse(BaseModel):
    total_reading_minutes: int
    total_books_read: int
    active_reading_count: int
    total_notes_count: int
    recent_books: List[RecentlyReadBook]
