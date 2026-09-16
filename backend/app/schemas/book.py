from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.enums import AvailabilityType, BookStatus


class BookBase(BaseModel):
    title: str
    author_name: str
    description: Optional[str] = None
    genre: Optional[str] = None
    language: str = "en"
    publication_year: Optional[int] = None
    availability_type: AvailabilityType = AvailabilityType.MARKETPLACE
    price: Decimal = Decimal("0.00")
    external_url: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author_name: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    publication_year: Optional[int] = None
    price: Optional[Decimal] = None
    status: Optional[BookStatus] = None
    external_url: Optional[str] = None


class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_profile_id: Optional[UUID] = None
    status: BookStatus
    cover_image_url: Optional[str] = None
    file_format: Optional[str] = None
    created_at: datetime
    updated_at: datetime