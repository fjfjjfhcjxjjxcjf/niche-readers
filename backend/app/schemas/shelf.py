from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.enums import ShelfType
from app.schemas.book import BookResponse


class ShelfItemCreate(BaseModel):
    book_id: UUID
    shelf_type: ShelfType = ShelfType.WANT_TO_READ


class ShelfItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shelf_type: ShelfType
    created_at: datetime
    book: BookResponse