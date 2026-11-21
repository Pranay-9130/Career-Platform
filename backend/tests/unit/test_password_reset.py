import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.password_reset import PasswordResetToken, PasswordResetOTP
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
    """Registered user requesting password reset receives a token, OTP, and email dispatch."""
    EmailService.clear_dev_otps()
    email = "forgot_user@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "OriginalPassword1!", "full_name": "Forgot User"},
    )

    resp = await client.post("/api/auth/forgot-password", json={"email": email})
    assert resp.status_code == 200
    assert "verification code" in resp.json()["message"].lower() or "reset" in resp.json()["message"].lower()

    reset_token = EmailService.get_last_dev_reset_token(email)
    assert reset_token is not None
    assert len(reset_token) >= 32

    otp = EmailService.get_last_dev_otp(email)
    assert otp is not None
    assert len(otp) == 6


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_enumeration_defense(client):
    """Unknown email returns generic success message without leaking account absence."""
    resp = await client.post("/api/auth/forgot-password", json={"email": "nobody@university.edu"})
    assert resp.status_code == 200
    assert "verification code" in resp.json()["message"].lower() or "reset" in resp.json()["message"].lower()
    # No token or OTP should be created for nonexistent user
    assert EmailService.get_last_dev_reset_token("nobody@university.edu") is None
    assert EmailService.get_last_dev_otp("nobody@university.edu") is None


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
    assert "successfully" in reset_resp.json()["message"].lower()

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


@pytest.mark.asyncio
async def test_full_otp_password_reset_flow(client):
    """Complete 3-step OTP password reset: request OTP, verify 6-digit code, reset password."""
    EmailService.clear_dev_otps()
    email = "otp_flow_student@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "OldPassword123!", "full_name": "OTP Student"},
    )

    # Step 1: Request OTP
    req_resp = await client.post("/api/auth/forgot-password", json={"email": email})
    assert req_resp.status_code == 200
    assert req_resp.json()["success"] is True
    assert "verification code" in req_resp.json()["message"]

    otp_code = EmailService.get_last_dev_otp(email)
    assert otp_code is not None
    assert len(otp_code) == 6
    assert otp_code.isdigit()

    # Step 2: Verify OTP
    verify_resp = await client.post(
        "/api/auth/verify-reset-otp",
        json={"email": email, "otp": otp_code},
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["success"] is True
    assert "reset_token" in verify_data
    reset_token = verify_data["reset_token"]
    assert len(reset_token) >= 32

    # Step 3: Reset Password
    new_password = "BrandNewSecurePassword2026!"
    reset_resp = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "reset_token": reset_token, "new_password": new_password},
    )
    assert reset_resp.status_code == 200
    assert "successfully" in reset_resp.json()["message"].lower()

    # Verify old password is rejected
    bad_login = await client.post("/api/auth/login", json={"email": email, "password": "OldPassword123!"})
    assert bad_login.status_code == 401

    # Verify new password logs in
    good_login = await client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()


@pytest.mark.asyncio
async def test_otp_attempt_limits_and_lockout(client):
    """Enforces 5 incorrect attempts max before OTP lockout."""
    EmailService.clear_dev_otps()
    email = "attempts_test@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "Attempts Test"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    correct_otp = EmailService.get_last_dev_otp(email)

    # 4 incorrect attempts
    for attempt in range(1, 5):
        resp = await client.post(
            "/api/auth/verify-reset-otp",
            json={"email": email, "otp": "000000"},
        )
        assert resp.status_code == 400
        assert f"{5 - attempt} attempt" in resp.json()["detail"]

    # 5th incorrect attempt locks out
    resp5 = await client.post(
        "/api/auth/verify-reset-otp",
        json={"email": email, "otp": "000000"},
    )
    assert resp5.status_code == 400
    assert "Maximum attempts exceeded" in resp5.json()["detail"]

    # Even the correct OTP is now rejected because it was locked out
    resp_correct = await client.post(
        "/api/auth/verify-reset-otp",
        json={"email": email, "otp": correct_otp},
    )
    assert resp_correct.status_code == 400


@pytest.mark.asyncio
async def test_otp_expiration(client, db_session):
    """Expired OTP codes cannot be verified."""
    EmailService.clear_dev_otps()
    email = "expired_otp@university.edu"
    await client.post(
        "/api/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "Expired Test"},
    )
    await client.post("/api/auth/forgot-password", json={"email": email})
    otp_code = EmailService.get_last_dev_otp(email)

    # Manually expire the record in database
    otp_rec = (
        await db_session.execute(
            select(PasswordResetOTP).where(PasswordResetOTP.email == email)
        )
    ).scalar_one()
    otp_rec.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    await db_session.commit()

    resp = await client.post(
        "/api/auth/verify-reset-otp",
        json={"email": email, "otp": otp_code},
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()
