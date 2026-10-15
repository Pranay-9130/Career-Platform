import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.otp import OTPVerification
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
async def test_registration_skips_otp_but_optional_request_dispatches_one(client):
    """Registration is immediate; users may still request optional verification."""
    EmailService.clear_dev_otps()
    email = "new_student@university.edu"
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "New Student",
    }
    reg_response = await client.post("/api/auth/register", json=payload)
    assert reg_response.status_code == 201
    assert "registered successfully" in reg_response.json()["message"]
    assert EmailService.get_last_dev_otp(email) is None

    send_response = await client.post(
        "/api/auth/send-otp", json={"email": email, "purpose": "registration"}
    )
    assert send_response.status_code == 200

    # Verify an OTP was captured by EmailService
    dispatched_otp = EmailService.get_last_dev_otp(email)
    assert dispatched_otp is not None
    assert len(dispatched_otp) == 6
    assert dispatched_otp.isdigit()


@pytest.mark.asyncio
async def test_verify_otp_success_activates_account(client, db_session):
    """Submitting the valid 6-digit OTP verifies user and returns success."""
    EmailService.clear_dev_otps()
    email = "verify_me@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Verify Me",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})

    otp_code = EmailService.get_last_dev_otp(email)
    assert otp_code is not None

    # Submit verification
    verify_resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": otp_code, "purpose": "registration"},
    )
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert data["success"] is True
    assert data["is_verified"] is True
    assert data["user"]["is_verified"] is True
    assert "access_token" in data

    # Verify user record in database
    user = (await db_session.execute(select(User).where(User.email == email))).scalar_one()
    assert user.is_verified is True


@pytest.mark.asyncio
async def test_verify_otp_invalid_code_decrements_attempts(client):
    """Invalid OTP code decrements remaining attempts and returns 400."""
    email = "invalid_code@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Attempt Tester",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})

    verify_resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": "000000", "purpose": "registration"},
    )
    assert verify_resp.status_code == 400
    assert "4 attempt(s) remaining" in verify_resp.json()["detail"]


@pytest.mark.asyncio
async def test_verify_otp_fifth_failed_attempt_locks(client):
    """Failing 5 attempts invalidates the OTP and rejects subsequent tries."""
    email = "lockout@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Lockout Tester",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})

    for i in range(4):
        resp = await client.post(
            "/api/auth/verify-otp",
            json={"email": email, "otp": f"11111{i}", "purpose": "registration"},
        )
        assert resp.status_code == 400

    # 5th attempt: should trigger lockout
    fifth_resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": "999999", "purpose": "registration"},
    )
    assert fifth_resp.status_code == 400
    assert "Maximum attempts" in fifth_resp.json()["detail"]


@pytest.mark.asyncio
async def test_verify_otp_expired_code_rejected(client, db_session):
    """Expired OTPs cannot be verified."""
    email = "expired@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Expired Tester",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})
    otp_code = EmailService.get_last_dev_otp(email)

    # Manually expire the OTP in database
    otp_record = (
        await db_session.execute(
            select(OTPVerification).where(OTPVerification.email == email)
        )
    ).scalar_one()
    otp_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    await db_session.commit()

    resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": otp_code, "purpose": "registration"},
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_resend_otp_cooldown_enforced(client):
    """Requesting resend within 60s cooldown triggers HTTP 429 Too Many Requests."""
    email = "cooldown@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Cooldown Tester",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})

    # Immediate resend attempt
    resend_resp = await client.post(
        "/api/auth/resend-otp",
        json={"email": email, "purpose": "registration"},
    )
    assert resend_resp.status_code == 429
    assert "seconds before requesting" in resend_resp.json()["detail"]


@pytest.mark.asyncio
async def test_resend_otp_after_cooldown_succeeds(client, db_session):
    """Requesting resend after cooldown period generates a new OTP code."""
    email = "resend_ok@university.edu"
    await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Resend Tester",
        },
    )
    await client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})
    first_otp = EmailService.get_last_dev_otp(email)

    # Fast forward the created_at timestamp past 60s
    otp_record = (
        await db_session.execute(
            select(OTPVerification).where(OTPVerification.email == email)
        )
    ).scalar_one()
    otp_record.created_at = datetime.now(timezone.utc) - timedelta(seconds=70)
    await db_session.commit()

    # Resend now succeeds
    resend_resp = await client.post(
        "/api/auth/resend-otp",
        json={"email": email, "purpose": "registration"},
    )
    assert resend_resp.status_code == 200
    data = resend_resp.json()
    assert data["success"] is True

    new_otp = EmailService.get_last_dev_otp(email)
    assert new_otp is not None
    # Now verify with new OTP
    verify_resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": email, "otp": new_otp, "purpose": "registration"},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_verified"] is True
