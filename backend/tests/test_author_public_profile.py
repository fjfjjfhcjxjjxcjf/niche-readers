import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models import Book, AuthorProfile, User, UserRole, BookStatus

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
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
async def test_public_author_profile_filtering():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        db = TestingSessionLocal()
        user = User(email="showcase@example.com", hashed_password="pw", role=UserRole.AUTHOR)
        db.add(user)
        db.flush()

        profile = AuthorProfile(
            user_id=user.id,
            display_name="Virginia Woolf",
            bio="Modernist literary pioneer."
        )
        db.add(profile)
        db.flush()

        # 1 Published book
        b1 = Book(
            title="To the Lighthouse",
            author_name="Virginia Woolf",
            author_profile_id=profile.id,
            status=BookStatus.PUBLISHED
        )
        # 1 Draft / Pending book
        b2 = Book(
            title="Unfinished Manuscript",
            author_name="Virginia Woolf",
            author_profile_id=profile.id,
            status=BookStatus.PENDING_REVIEW
        )
        db.add_all([b1, b2])
        db.commit()

        author_id = str(profile.id)
        db.close()

        # Test profile endpoint
        prof_res = await client.get(f"/api/v1/authors/{author_id}/public")
        assert prof_res.status_code == 200
        assert prof_res.json()["display_name"] == "Virginia Woolf"
        assert prof_res.json()["published_books_count"] == 1

        # Test books endpoint (must only show PUBLISHED)
        books_res = await client.get(f"/api/v1/authors/{author_id}/books")
        assert books_res.status_code == 200
        items = books_res.json()
        assert len(items) == 1
        assert items[0]["title"] == "To the Lighthouse"