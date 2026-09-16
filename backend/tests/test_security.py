from datetime import timedelta
from jose import jwt
from app.core.security import get_password_hash, verify_password, create_access_token, ALGORITHM
from app.core.config import settings


def test_password_hashing():
    password = "secret_secure_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_token_creation_and_payload():
    subject = "user-uuid-1234"
    token = create_access_token(subject=subject, expires_delta=timedelta(minutes=15))
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == subject
    assert "exp" in payload