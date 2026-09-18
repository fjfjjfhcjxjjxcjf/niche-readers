from app.models.book import Book
from app.schemas.book import BookCreate, BookResponse
from app.models.enums import AvailabilityType


def test_book_model_extended_metadata():
    book = Book(
        title="Babel",
        author_name="R.F. Kuang",
        isbn="978-0063021426",
        original_publisher="Harper Voyager",
        rights_statement="Standard copyrighted edition.",
        page_count=544,
        availability_type=AvailabilityType.EXTERNAL_LEGAL
    )
    assert book.isbn == "978-0063021426"
    assert book.original_publisher == "Harper Voyager"
    assert book.page_count == 544
    assert book.rights_statement == "Standard copyrighted edition."


def test_book_schema_validation():
    data = {
        "title": "The Employees",
        "author_name": "Olga Ravn",
        "language": "en",
        "isbn": "978-1913097363",
        "page_count": 136,
        "availability_type": "EXTERNAL_LEGAL"
    }
    book_schema = BookCreate(**data)
    assert book_schema.isbn == "978-1913097363"
    assert book_schema.page_count == 136
