import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api import deps
from app.models.book import Book
from app.models.enums import BookStatus, AvailabilityType
from app.schemas.book import BookResponse
from app.schemas.pagination import PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[BookResponse])
def list_books(
    db: Session = Depends(deps.get_db),
    query: Optional[str] = Query(None, description="Search by title, author, or genre"),
    availability: Optional[AvailabilityType] = Query(None, description="Filter by availability type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=50, description="Items per page")
):
    stmt = db.query(Book).filter(Book.status == BookStatus.PUBLISHED)

    if availability:
        stmt = stmt.filter(Book.availability_type == availability)

    if query and query.strip():
        search_term = query.strip()
        bind = db.get_bind()

        # Check if running against Postgres to leverage full-text search functions
        if bind and bind.dialect.name == "postgresql":
            # Postgres Full-Text Search tsvector vectorization
            ts_query = func.plainto_tsquery("english", search_term)
            ts_vector = (
                func.setweight(func.to_tsvector("english", func.coalesce(Book.title, "")), "A")
                .concat(func.setweight(func.to_tsvector("english", func.coalesce(Book.author_name, "")), "B"))
                .concat(func.setweight(func.to_tsvector("english", func.coalesce(Book.genre, "")), "C"))
                .concat(func.setweight(func.to_tsvector("english", func.coalesce(Book.description, "")), "D"))
            )
            stmt = stmt.filter(ts_vector.op("@@")(ts_query)).order_by(
                func.ts_rank(ts_vector, ts_query).desc(),
                Book.created_at.desc()
            )
        else:
            # Fallback for SQLite in memory testing
            search_pattern = f"%{search_term}%"
            stmt = stmt.filter(
                or_(
                    Book.title.ilike(search_pattern),
                    Book.author_name.ilike(search_pattern),
                    Book.genre.ilike(search_pattern),
                    Book.description.ilike(search_pattern)
                )
            ).order_by(Book.created_at.desc())
    else:
        stmt = stmt.order_by(Book.created_at.desc())

    total_count = stmt.count()
    offset = (page - 1) * page_size
    books = stmt.offset(offset).limit(page_size).all()
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return {
        "items": books,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, db: Session = Depends(deps.get_db)):
    book = db.query(Book).filter(Book.id == book_id, Book.status == BookStatus.PUBLISHED).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book