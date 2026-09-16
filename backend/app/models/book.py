import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.enums import AvailabilityType, BookStatus


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(300), nullable=False, index=True)
    author_name = Column(String(200), nullable=False, index=True)
    author_profile_id = Column(UUID(as_uuid=True), ForeignKey("author_profiles.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(Text, nullable=True)
    genre = Column(String(100), nullable=True, index=True)
    language = Column(String(10), default="en", nullable=False)
    publication_year = Column(Integer, nullable=True)
    cover_image_url = Column(String(500), nullable=True)

    availability_type = Column(Enum(AvailabilityType), nullable=False, default=AvailabilityType.MARKETPLACE)
    status = Column(Enum(BookStatus), nullable=False, default=BookStatus.DRAFT)
    price = Column(Numeric(10, 2), default=0.00, nullable=False)

    file_path = Column(String(500), nullable=True)
    file_format = Column(String(10), nullable=True)  # EPUB, PDF
    external_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    author_profile = relationship("AuthorProfile", back_populates="books")
    shelf_items = relationship("ShelfItem", back_populates="book", cascade="all, delete-orphan")