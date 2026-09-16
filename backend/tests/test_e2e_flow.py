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
async def test_full_reader_author_admin_flow(tmp_path):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Register Admin & Author
        await client.post(
            "/api/v1/auth/register",
            json={"email": "admin.e2e@example.com", "password": "AdminPassword123!", "role": "ADMIN"}
        )
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin.e2e@example.com", "password": "AdminPassword123!"}
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

        author_reg = await client.post(
            "/api/v1/auth/register",
            json={"email": "author.e2e@example.com", "password": "StrongPassword123!", "role": "AUTHOR"}
        )
        author_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "author.e2e@example.com", "password": "StrongPassword123!"}
        )
        author_headers = {"Authorization": f"Bearer {author_login.json()['access_token']}"}

        # 2. Publish Independent Book (goes to PENDING_REVIEW)
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
        book_id = publish_res.json()["id"]

        # Book should NOT be visible in public catalog yet
        cat_pre = await client.get("/api/v1/books/?query=Odyssey")
        assert cat_pre.json()["total_count"] == 0

        # 3. Admin Reviews & Approves Book
        pending_list = await client.get("/api/v1/admin/books/pending", headers=admin_headers)
        assert pending_list.status_code == 200
        assert any(b["id"] == book_id for b in pending_list.json())

        approve_res = await client.post(f"/api/v1/admin/books/{book_id}/approve", headers=admin_headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "PUBLISHED"

        # Now book is discoverable in public catalog
        catalog_res = await client.get("/api/v1/books/?query=Odyssey")
        assert catalog_res.status_code == 200
        paginated = catalog_res.json()
        assert paginated["total_count"] == 1
        assert paginated["items"][0]["id"] == book_id

        # 4. Register Reader & Mock Checkout
        await client.post(
            "/api/v1/auth/register",
            json={"email": "reader.e2e@example.com", "password": "ReaderPassword123!", "role": "READER"}
        )
        reader_login = await client.post(
            "/api/v1/auth/login",
            json={"email": "reader.e2e@example.com", "password": "ReaderPassword123!"}
        )
        reader_headers = {"Authorization": f"Bearer {reader_login.json()['access_token']}"}

        # Denied prior to purchase
        assert (await client.get(f"/api/v1/library/content/{book_id}", headers=reader_headers)).status_code == 403

        # Checkout
        assert (await client.post(f"/api/v1/library/checkout/mock/{book_id}", headers=reader_headers)).status_code == 200

        # Permitted post-purchase
        access_res = await client.get(f"/api/v1/library/content/{book_id}", headers=reader_headers)
        assert access_res.status_code == 200
        assert access_res.headers["content-type"] == "application/epub+zip"