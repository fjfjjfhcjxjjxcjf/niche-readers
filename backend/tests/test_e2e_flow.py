import io
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.db.seed import generate_minimal_epub

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
async def test_full_reader_author_flow(tmp_path):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Register Author
        author_reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "author.e2e@example.com",
                "password": "StrongPassword123!",
                "role": "AUTHOR"
            }
        )
        assert author_reg.status_code == 201

        # Author Login
        author_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "author.e2e@example.com", "password": "StrongPassword123!"}
        )
        assert author_login.status_code == 200
        author_token = author_login.json()["access_token"]
        author_headers = {"Authorization": f"Bearer {author_token}"}

        # 2. Publish Independent Book
        epub_file_path = tmp_path / "manuscript.epub"
        generate_minimal_epub(
            str(epub_file_path),
            "The Postmodern Odyssey",
            "Author E2E",
            "An adventurous journey into speculative narrative."
        )

        with open(epub_file_path, "rb") as f:
            publish_res = await client.post(
                "/api/v1/authors/books",
                headers=author_headers,
                data={
                    "title": "The Postmodern Odyssey",
                    "description": "Exploration of avant-garde narrative forms.",
                    "genre": "Speculative",
                    "language": "en",
                    "publication_year": 2024,
                    "price": "5.99"
                },
                files={"manuscript": ("manuscript.epub", f.read(), "application/epub+zip")}
            )
        assert publish_res.status_code == 201
        book_data = publish_res.json()
        book_id = book_data["id"]
        assert book_data["title"] == "The Postmodern Odyssey"

        # 3. Discovery: Search in paginated public catalog
        catalog_res = await client.get("/api/v1/books/?query=Odyssey")
        assert catalog_res.status_code == 200
        paginated = catalog_res.json()
        assert paginated["total_count"] == 1
        assert paginated["items"][0]["id"] == book_id

        # 4. Register Reader
        reader_reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "reader.e2e@example.com",
                "password": "ReaderPassword123!",
                "role": "READER"
            }
        )
        assert reader_reg.status_code == 201

        # Reader Login
        reader_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "reader.e2e@example.com", "password": "ReaderPassword123!"}
        )
        assert reader_login.status_code == 200
        reader_token = reader_login.json()["access_token"]
        reader_headers = {"Authorization": f"Bearer {reader_token}"}

        # 5. Access check: Reader attempts to access content prior to checkout -> 403 Forbidden
        denied_access = await client.get(
            f"/api/v1/library/content/{book_id}",
            headers=reader_headers
        )
        assert denied_access.status_code == 403

        # 6. Reader performs Mock Checkout
        checkout_res = await client.post(
            f"/api/v1/library/checkout/mock/{book_id}",
            headers=reader_headers
        )
        assert checkout_res.status_code == 200

        # Verify book exists on reader's shelf
        shelf_res = await client.get("/api/v1/library/shelf", headers=reader_headers)
        assert shelf_res.status_code == 200
        shelf_items = shelf_res.json()
        assert any(item["book"]["id"] == book_id and item["shelf_type"] == "PURCHASED" for item in shelf_items)

        # 7. Reader accesses content after purchase -> 200 OK with EPUB binary
        authorized_access = await client.get(
            f"/api/v1/library/content/{book_id}",
            headers=reader_headers
        )
        assert authorized_access.status_code == 200
        assert authorized_access.headers["content-type"] == "application/epub+zip"