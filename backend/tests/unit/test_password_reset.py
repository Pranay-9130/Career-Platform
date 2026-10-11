import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.services.email_service import EmailService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_forgot_password_known_user(client):
    """Registered user requesting password reset receives a token and email dispatch."""
    EmailService.clear_dev_otps()
    email = "forgot_user@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "OriginalPassword1!", "full_name": "Forgot User"},
    )

    resp = await client.post("/api/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    assert "sent a password reset link" in resp.json()["message"]

    reset_token = EmailService.get_last_dev_reset_token(email)
    assert reset_token is not None
    assert len(reset_token) >= 32


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_enumeration_defense(client):
    """Unknown email returns generic success message without leaking account absence."""
    resp = await client.post("/api/auth/forgot-password", json={"email": "nobody@university.edu"})
    assert resp.status_code == 200
    assert "sent a password reset link" in resp.json()["message"]
    # No token should be created for nonexistent user
    assert EmailService.get_last_dev_reset_token("nobody@university.edu") is None


@pytest.mark.asyncio
async def test_verify_reset_token_endpoint(client):
    """Valid token passes verification endpoint; invalid token returns 400."""
    email = "token_tester@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "OriginalPassword1!", "full_name": "Token Tester"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    token = EmailService.get_last_dev_reset_token(email)

    # Valid token
    valid_resp = await client.post(
        "/api/auth/verify-reset-token",
        json={"email": email, "token": token},
    )
    assert valid_resp.status_code == 200
    assert valid_resp.json()["valid"] is True

    # Tampered token
    invalid_resp = await client.post(
        "/api/auth/verify-reset-token",
        json={"email": email, "token": "tampered_fake_token_value_here"},
    )
    assert invalid_resp.status_code == 400


@pytest.mark.asyncio
async def test_reset_password_success_and_login(client):
    """Resetting password updates user hash, allows login with new password, and blocks old password."""
    email = "reset_login@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "InitialPassword123!", "full_name": "Reset Login User"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    token = EmailService.get_last_dev_reset_token(email)

    # Reset password
    reset_resp = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "token": token, "new_password": "BrandNewPassword999#"},
    )
    assert reset_resp.status_code == 200
    assert "successfully reset" in reset_resp.json()["message"]

    # Old password fails
    old_login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "InitialPassword123!"},
    )
    assert old_login.status_code == 401

    # New password succeeds
    new_login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "BrandNewPassword999#"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


@pytest.mark.asyncio
async def test_reset_token_single_use_enforcement(client):
    """Once a reset token is used, it cannot be reused."""
    email = "single_use@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "InitialPassword123!", "full_name": "Single Use"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    token = EmailService.get_last_dev_reset_token(email)

    # First use
    resp1 = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "token": token, "new_password": "NewPassword123!"},
    )
    assert resp1.status_code == 200

    # Second use with same token fails
    resp2 = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "token": token, "new_password": "AnotherNewPassword123!"},
    )
    assert resp2.status_code == 400
    assert "already been used" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_reset_token_expiration(client, db_session):
    """Expired reset tokens are rejected."""
    email = "expired_token@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "InitialPassword123!", "full_name": "Expired User"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    token = EmailService.get_last_dev_reset_token(email)

    # Manually expire token
    record = (
        await db_session.execute(
            select(PasswordResetToken).where(PasswordResetToken.email == email)
        )
    ).scalar_one()
    record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    await db_session.commit()

    # Attempt reset
    resp = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "token": token, "new_password": "NewPassword123!"},
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"]
