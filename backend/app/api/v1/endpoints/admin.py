from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.models.book import Book
from app.models.enums import UserRole, BookStatus
from app.schemas.book import BookResponse

router = APIRouter()


class ReviewAction(BaseModel):
    rejection_reason: str = None


@router.get("/books/pending", response_model=List[BookResponse])
def get_pending_review_books(
    db: Session = Depends(deps.get_db),
    admin_user = Depends(deps.require_role(UserRole.ADMIN))
):
    return db.query(Book).filter(Book.status == BookStatus.PENDING_REVIEW).order_by(Book.created_at.asc()).all()


@router.post("/books/{book_id}/approve", response_model=BookResponse)
def approve_book(
    book_id: UUID,
    db: Session = Depends(deps.get_db),
    admin_user = Depends(deps.require_role(UserRole.ADMIN))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    book.status = BookStatus.PUBLISHED
    db.commit()
    db.refresh(book)
    return book


@router.post("/books/{book_id}/reject", response_model=BookResponse)
def reject_book(
    book_id: UUID,
    action: ReviewAction,
    db: Session = Depends(deps.get_db),
    admin_user = Depends(deps.require_role(UserRole.ADMIN))
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    book.status = BookStatus.REJECTED
    db.commit()
    db.refresh(book)
    return book