from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api import deps
from app.models.book import Book
from app.models.enums import BookStatus, AvailabilityType
from app.schemas.book import BookResponse

router = APIRouter()


@router.get("/", response_model=List[BookResponse])
def list_books(
    db: Session = Depends(deps.get_db),
    query: Optional[str] = Query(None, description="Search by title, author, or genre"),
    availability: Optional[AvailabilityType] = Query(None, description="Filter by availability type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    stmt = db.query(Book).filter(Book.status == BookStatus.PUBLISHED)

    if availability:
        stmt = stmt.filter(Book.availability_type == availability)

    if query:
        search_pattern = f"%{query.strip()}%"
        stmt = stmt.filter(
            or_(
                Book.title.ilike(search_pattern),
                Book.author_name.ilike(search_pattern),
                Book.genre.ilike(search_pattern)
            )
        )

    books = stmt.order_by(Book.created_at.desc()).offset(skip).limit(limit).all()
    return books


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, db: Session = Depends(deps.get_db)):
    book = db.query(Book).filter(Book.id == book_id, Book.status == BookStatus.PUBLISHED).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book