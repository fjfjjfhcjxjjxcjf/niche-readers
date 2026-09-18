from app.models.book import Book
from app.models.shelf import ReadingSession
from app.models.enums import AvailabilityType, BookStatus


def test_reading_stats_calculation(client, db_session, test_user):
    # Create sample book
    book = Book(
        title="Kaili Blues Notebook",
        author_name="Independent Cinematographer",
        availability_type=AvailabilityType.PUBLIC_DOMAIN,
        status=BookStatus.PUBLISHED
    )
    db_session.add(book)
    db_session.commit()

    # Send two 60s activity pings
    p1 = client.post("/api/v1/library/stats/ping", json={"book_id": str(book.id), "duration_seconds": 60})
    p2 = client.post("/api/v1/library/stats/ping", json={"book_id": str(book.id), "duration_seconds": 60})
    assert p1.status_code == 204
    assert p2.status_code == 204

    # Fetch stats
    stats_res = client.get("/api/v1/library/stats/me")
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_reading_minutes"] == 2
    assert len(data["recent_books"]) == 1
    assert data["recent_books"][0]["title"] == "Kaili Blues Notebook"
