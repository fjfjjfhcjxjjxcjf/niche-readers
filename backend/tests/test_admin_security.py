import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

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
async def test_admin_endpoints_role_protection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register a standard reader
        await client.post(
            "/api/v1/auth/register",
            json={"email": "reader.gate@example.com", "password": "PassWord123!", "role": "READER"}
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "reader.gate@example.com", "password": "PassWord123!"}
        )
        token = login_res.json()["access_token"]
        reader_headers = {"Authorization": f"Bearer {token}"}

        # Reader must be forbidden from accessing admin endpoints
        res = await client.get("/api/v1/admin/books/pending", headers=reader_headers)
        assert res.status_code == 403