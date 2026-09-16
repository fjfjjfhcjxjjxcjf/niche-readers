import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

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
async def test_author_dashboard_access_gate():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # Register regular reader
        await client.post(
            "/api/v1/auth/register",
            json={"email": "reader_check@example.com", "password": "Pass123!Password", "role": "READER"}
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "reader_check@example.com", "password": "Pass123!Password"}
        )
        token = login_res.json()["access_token"]

        # Reader must receive 403 when trying to access author dashboard
        res = await client.get(
            "/api/v1/authors/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 403