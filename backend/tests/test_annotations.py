import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models import Book, AvailabilityType, BookStatus

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.mark.asyncio
async def test_annotations_crud_flow():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Register and login user
        await client.post(
            "/api/v1/auth/register",
            json={"email": "annotator@example.com", "password": "PassWord123!", "role": "READER"}
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "annotator@example.com", "password": "PassWord123!"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Seed sample book directly
        db = TestingSessionLocal()
        book = Book(
            title="Annotation Test Novel",
            author_name="Literary Tester",
            availability_type=AvailabilityType.PUBLIC_DOMAIN,
            status=BookStatus.PUBLISHED
        )
        db.add(book)
        db.commit()
        db.refresh(book)
        book_id = str(book.id)
        db.close()

        # 1. Create Annotation
        create_res = await client.post(
            f"/api/v1/library/books/{book_id}/annotations",
            headers=headers,
            json={
                "cfi_range": "epubcfi(/6/2[chapter1]!/4/2/10,/1:0,/1:25)",
                "highlighted_text": "Remarkable passage of literary interest.",
                "note": "A note on symbolism.",
                "color": "yellow"
            }
        )
        assert create_res.status_code == 201
        anno_data = create_res.json()
        anno_id = anno_data["id"]
        assert anno_data["color"] == "yellow"

        # 2. List Annotations
        list_res = await client.get(
            f"/api/v1/library/books/{book_id}/annotations",
            headers=headers
        )
        assert list_res.status_code == 200
        items = list_res.json()
        assert len(items) == 1
        assert items[0]["id"] == anno_id

        # 3. Delete Annotation
        del_res = await client.delete(
            f"/api/v1/library/annotations/{anno_id}",
            headers=headers
        )
        assert del_res.status_code == 204

        # 4. Verify empty list
        empty_res = await client.get(
            f"/api/v1/library/books/{book_id}/annotations",
            headers=headers
        )
        assert len(empty_res.json()) == 0