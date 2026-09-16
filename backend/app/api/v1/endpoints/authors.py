import os
import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.storage import get_storage
from app.models.book import Book
from app.models.user import User
from app.models.enums import UserRole, AvailabilityType, BookStatus
from app.schemas.book import BookResponse

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
    # Validate manuscript extension
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

    book = Book(
        title=title,
        author_name=author_name,
        author_profile_id=author_profile.id if author_profile else None,
        description=description,
        genre=genre,
        language=language,
        publication_year=publication_year,
        availability_type=AvailabilityType.MARKETPLACE,
        status=BookStatus.PUBLISHED,
        price=price,
        file_path=saved_file_path,
        file_format=file_format,
        cover_image_url=saved_cover_path
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book