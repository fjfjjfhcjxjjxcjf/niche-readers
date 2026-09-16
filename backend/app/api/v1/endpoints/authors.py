import os
import uuid
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.storage import get_storage
from app.models.book import Book
from app.models.shelf import ShelfItem
from app.models.user import User
from app.models.enums import UserRole, AvailabilityType, BookStatus, ShelfType
from app.schemas.book import BookResponse, BookUpdate
from app.schemas.author import AuthorDashboardStats, BookAnalytics

router = APIRouter()
storage = get_storage()

ALLOWED_MANUSCRIPT_EXTENSIONS = {".epub", ".pdf"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@router.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def publish_author_book(
    title: str = Form(...),
    description: str = Form(None),
    genre: str = Form(None),
    language: str = Form("en"),
    publication_year: int = Form(None),
    price: Decimal = Form(Decimal("0.00")),
    manuscript: UploadFile = File(...),
    cover_image: UploadFile = File(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(UserRole.AUTHOR))
):
    ext = os.path.splitext(manuscript.filename)[1].lower()
    if ext not in ALLOWED_MANUSCRIPT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format. Allowed: {', '.join(ALLOWED_MANUSCRIPT_EXTENSIONS)}"
        )

    file_format = ext.replace(".", "").upper()
    manuscript_filename = f"{uuid.uuid4()}{ext}"
    saved_file_path = storage.save_file(
        manuscript.file,
        manuscript_filename,
        subfolder="manuscripts"
    )

    saved_cover_path = None
    if cover_image:
        cover_ext = os.path.splitext(cover_image.filename)[1].lower()
        if cover_ext in ALLOWED_IMAGE_EXTENSIONS:
            cover_filename = f"{uuid.uuid4()}{cover_ext}"
            saved_cover_path = storage.save_file(
                cover_image.file,
                cover_filename,
                subfolder="covers"
            )

    author_profile = current_user.author_profile
    author_name = author_profile.display_name if author_profile else current_user.email.split("@")[0]

    # Books are placed into PENDING_REVIEW queue for editorial oversight
    book = Book(
        title=title,
        author_name=author_name,
        author_profile_id=author_profile.id if author_profile else None,
        description=description,
        genre=genre,
        language=language,
        publication_year=publication_year,
        availability_type=AvailabilityType.MARKETPLACE,
        status=BookStatus.PENDING_REVIEW,
        price=price,
        file_path=saved_file_path,
        file_format=file_format,
        cover_image_url=saved_cover_path
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.get("/dashboard", response_model=AuthorDashboardStats)
def get_author_dashboard(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(UserRole.AUTHOR))
):
    profile = current_user.author_profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author profile not found")

    books = db.query(Book).filter(Book.author_profile_id == profile.id).all()
    book_analytics = []
    total_revenue = Decimal("0.00")
    total_sales_count = 0

    for book in books:
        purchases = db.query(ShelfItem).filter(
            ShelfItem.book_id == book.id,
            ShelfItem.shelf_type == ShelfType.PURCHASED
        ).count()
        shelf_adds = db.query(ShelfItem).filter(
            ShelfItem.book_id == book.id,
            ShelfItem.shelf_type != ShelfType.PURCHASED
        ).count()

        rev = book.price * purchases
        total_revenue += rev
        total_sales_count += purchases

        book_analytics.append(
            BookAnalytics(
                book_id=book.id,
                title=book.title,
                status=book.status,
                price=book.price,
                total_purchases=purchases,
                total_revenue=rev,
                shelf_saves_count=shelf_adds
            )
        )

    return AuthorDashboardStats(
        total_books=len(books),
        total_readers=total_sales_count,
        total_revenue=total_revenue,
        books=book_analytics
    )


@router.patch("/books/{book_id}", response_model=BookResponse)
def update_author_book(
    book_id: uuid.UUID,
    book_in: BookUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_role(UserRole.AUTHOR))
):
    profile = current_user.author_profile
    book = db.query(Book).filter(
        Book.id == book_id,
        Book.author_profile_id == profile.id
    ).first()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    for field, val in book_in.model_dump(exclude_unset=True).items():
        setattr(book, field, val)

    db.commit()
    db.refresh(book)
    return book