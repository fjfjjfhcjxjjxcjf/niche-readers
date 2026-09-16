import os
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.core.storage import get_storage
from app.models.book import Book
from app.models.shelf import ShelfItem
from app.models.user import User
from app.models.enums import ShelfType, AvailabilityType
from app.schemas.shelf import ShelfItemCreate, ShelfItemResponse

router = APIRouter()
storage = get_storage()


@router.get("/shelf", response_model=List[ShelfItemResponse])
def get_user_shelf(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return db.query(ShelfItem).filter(ShelfItem.user_id == current_user.id).all()


@router.post("/shelf", response_model=ShelfItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_shelf(
    item_in: ShelfItemCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == item_in.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    existing = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.book_id == item_in.book_id,
        ShelfItem.shelf_type == item_in.shelf_type
    ).first()
    if existing:
        return existing

    shelf_item = ShelfItem(
        user_id=current_user.id,
        book_id=item_in.book_id,
        shelf_type=item_in.shelf_type
    )
    db.add(shelf_item)
    db.commit()
    db.refresh(shelf_item)
    return shelf_item


@router.post("/checkout/mock/{book_id}", response_model=ShelfItemResponse)
def mock_checkout_book(
    book_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Check if already purchased
    existing = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.book_id == book_id,
        ShelfItem.shelf_type == ShelfType.PURCHASED
    ).first()
    if existing:
        return existing

    # Record purchase in user library
    purchase_item = ShelfItem(
        user_id=current_user.id,
        book_id=book_id,
        shelf_type=ShelfType.PURCHASED
    )
    db.add(purchase_item)
    db.commit()
    db.refresh(purchase_item)
    return purchase_item


@router.get("/content/{book_id}")
def read_book_content(
    book_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book or not book.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content file not found")

    # Authorization verification
    is_public = book.availability_type == AvailabilityType.PUBLIC_DOMAIN
    is_owner = book.author_profile and book.author_profile.user_id == current_user.id
    is_purchased = db.query(ShelfItem).filter(
        ShelfItem.user_id == current_user.id,
        ShelfItem.book_id == book_id,
        ShelfItem.shelf_type == ShelfType.PURCHASED
    ).first() is not None

    if not (is_public or is_owner or is_purchased):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Purchase required to access this file."
        )

    full_path = storage.get_file_path(book.file_path)
    media_type = "application/epub+zip" if book.file_format == "EPUB" else "application/pdf"
    return FileResponse(
        path=full_path,
        media_type=media_type,
        filename=os.path.basename(full_path)
    )