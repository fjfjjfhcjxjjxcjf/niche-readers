import pytest


def test_export_annotations_markdown(client, db_session, test_user):
    from app.models.book import Book
    from app.models.shelf import Annotation
    from app.models.enums import AvailabilityType, BookStatus

    # 1. Create a book
    book = Book(
        title="Stories of the Eye",
        author_name="Literary Pioneer",
        availability_type=AvailabilityType.PUBLIC_DOMAIN,
        status=BookStatus.PUBLISHED
    )
    db_session.add(book)
    db_session.commit()

    # 2. Add an annotation for this user
    note = Annotation(
        user_id=test_user.id,
        book_id=book.id,
        cfi_range="epubcfi(/6/2[chapter1]!/4/2/10)",
        highlighted_text="The city exists within a geometry of shadows.",
        note="Remarkable metaphor for architectural isolation.",
        color="amber"
    )
    db_session.add(note)
    db_session.commit()

    # 3. Request Markdown Export
    response = client.get(f"/api/v1/library/annotations/{book.id}/export/markdown")
    assert response.status_code == 200
    assert "text/markdown" in response.headers["content-type"]
    assert "Stories_of_the_Eye_annotations.md" in response.headers["content-disposition"]
    
    body = response.text
    assert "# Reading Notes & Highlights" in body
    assert "Stories of the Eye" in body
    assert "The city exists within a geometry of shadows." in body
    assert "Remarkable metaphor for architectural isolation." in body
