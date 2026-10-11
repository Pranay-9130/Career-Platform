from datetime import timedelta
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_token,
)

def test_password_hashing_and_verification():
    raw_pass = "SecurePass123!@#"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword999", hashed) is False

def test_create_and_decode_valid_access_token():
    payload_data = {"sub": "123e4567-e89b-12d3-a456-426614174000", "role": "STUDENT"}
    token = create_access_token(payload_data, expires_delta=timedelta(minutes=10))
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "123e4567-e89b-12d3-a456-426614174000"
    assert decoded["role"] == "STUDENT"
    assert "exp" in decoded

def test_decode_expired_token():
    payload_data = {"sub": "expired-user", "role": "STUDENT"}
    token = create_access_token(payload_data, expires_delta=timedelta(minutes=-5))
    decoded = decode_token(token)
    assert decoded is None

def test_decode_invalid_tampered_token():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature"
    decoded = decode_token(token)
    assert decoded is None
