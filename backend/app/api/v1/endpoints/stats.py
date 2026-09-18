from datetime import datetime
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.user import User
from app.models.book import Book
from app.models.shelf import ShelfItem, Annotation, ReadingSession
from app.models.enums import ShelfType
from app.schemas.reading_stats import ReadingPing, ReaderStatsResponse, RecentlyReadBook

router = APIRouter()


@router.post("/ping", status_code=status.HTTP_204_NO_CONTENT)
def record_reading_ping(
    ping: ReadingPing,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    session_entry = ReadingSession(
        user_id=current_user.id,
        book_id=ping.book_id,
        duration_seconds=ping.duration_seconds
    )
    db.add(session_entry)

    # Automatically set book shelf to READING if not finished
    existing_shelf = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.book_id == ping.book_id
    ).first()

    if not existing_shelf:
        db.add(ShelfItem(user_id=current_user.id, book_id=ping.book_id, shelf_type=ShelfType.READING))
    elif existing_shelf.shelf_type == ShelfType.WANT_TO_READ:
        existing_shelf.shelf_type = ShelfType.READING

    db.commit()


@router.get("/me", response_model=ReaderStatsResponse)
def get_reader_statistics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Total duration
    total_seconds = db.query(func.coalesce(func.sum(ReadingSession.duration_seconds), 0)).filter(
        ReadingSession.user_id == current_user.id
    ).scalar()
    total_minutes = int(total_seconds // 60)

    # Shelf counts
    books_finished = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.shelf_type == ShelfType.FINISHED
    ).count()

    active_reading = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.shelf_type == ShelfType.READING
    ).count()

    total_notes = db.query(Annotation).filter(
        Annotation.user_id == current_user.id
    ).count()

    # Aggregate recent books read
    recent_records = db.query(
        ReadingSession.book_id,
        func.max(ReadingSession.created_at).label("last_read"),
        func.sum(ReadingSession.duration_seconds).label("book_seconds")
    ).filter(
        ReadingSession.user_id == current_user.id
    ).group_by(ReadingSession.book_id).order_by(func.max(ReadingSession.created_at).desc()).limit(5).all()

    recent_books = []
    for rec in recent_records:
        book = db.query(Book).filter(Book.id == rec.book_id).first()
        if book:
            recent_books.append(
                RecentlyReadBook(
                    book_id=book.id,
                    title=book.title,
                    author_name=book.author_name,
                    cover_image_url=book.cover_image_url,
                    last_read_at=rec.last_read,
                    total_minutes=int(rec.book_seconds // 60)
                )
            )

    return ReaderStatsResponse(
        total_reading_minutes=total_minutes,
        total_books_read=books_finished,
        active_reading_count=active_reading,
        total_notes_count=total_notes,
        recent_books=recent_books
    )
