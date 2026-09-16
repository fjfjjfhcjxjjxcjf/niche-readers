from app.models import User, AuthorProfile, Book, ShelfItem, UserRole, AvailabilityType, ShelfType


def test_user_model_defaults():
    user = User(email="test@example.com", hashed_password="hashed_pw_placeholder")
    assert user.role == UserRole.READER
    assert user.is_active is True


def test_book_model_defaults():
    book = Book(
        title="The Passion of New Eve",
        author_name="Angela Carter",
        availability_type=AvailabilityType.EXTERNAL_LEGAL
    )
    assert book.title == "The Passion of New Eve"
    assert book.availability_type == AvailabilityType.EXTERNAL_LEGAL
    assert book.price == 0.00