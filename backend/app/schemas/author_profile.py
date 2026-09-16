from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.book import BookResponse


class AuthorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    website_url: Optional[str] = None


class AuthorPublicProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    website_url: Optional[str] = None
    created_at: datetime
    published_books_count: int = 0