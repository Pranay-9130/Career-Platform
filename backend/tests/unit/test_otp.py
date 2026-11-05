import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
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
async def test_registration_is_immediate_without_otp(client, db_session):
    """Registration creates active account immediately; OTP is neither required nor dispatched."""
    EmailService.clear_dev_otps()
    email = "direct_student@university.edu"
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Direct Student",
    }
    reg_response = await client.post("/api/auth/register", json=payload)
    assert reg_response.status_code == 201
    assert "registered successfully" in reg_response.json()["message"]
    assert "access_token" in reg_response.json()
    assert EmailService.get_last_dev_otp(email) is None

    # Verify user exists in database
    user = (await db_session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    assert user is not None
    assert user.is_active is True


@pytest.mark.asyncio
async def test_legacy_send_otp_endpoint_is_retired(client):
    """Calling retired send-otp endpoint returns HTTP 410 Gone."""
    resp = await client.post("/api/auth/send-otp", json={"email": "test@university.edu", "purpose": "registration"})
    assert resp.status_code == 410
    assert "retired" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_legacy_resend_otp_endpoint_is_retired(client):
    """Calling retired resend-otp endpoint returns HTTP 410 Gone."""
    resp = await client.post("/api/auth/resend-otp", json={"email": "test@university.edu", "purpose": "registration"})
    assert resp.status_code == 410
    assert "retired" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_legacy_verify_otp_endpoint_is_retired(client):
    """Calling retired verify-otp endpoint returns HTTP 410 Gone."""
    resp = await client.post(
        "/api/auth/verify-otp",
        json={"email": "test@university.edu", "otp": "123456", "purpose": "registration"},
    )
    assert resp.status_code == 410
    assert "retired" in resp.json()["detail"].lower()


def test_otp_verifications_table_not_in_declarative_metadata():
    """Ensure otp_verifications model is completely absent from active SQLAlchemy metadata."""
    assert "otp_verifications" not in Base.metadata.tables
