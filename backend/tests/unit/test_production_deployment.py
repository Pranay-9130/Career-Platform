import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import Settings, settings
from app.services.email_service import EmailService
from app.models.user import User, UserRole
from sqlalchemy import select


import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db

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
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_root_health_endpoints():
    """Verify both /health and /api/health return healthy 200 for cloud orchestrators."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Root health check (used by Render)
        res_root = await client.get("/health")
        assert res_root.status_code == 200
        data_root = res_root.json()
        assert data_root["status"] == "healthy"

        # API health check (used by Vercel / frontend)
        res_api = await client.get("/api/health")
        assert res_api.status_code == 200
        data_api = res_api.json()
        assert data_api["status"] == "healthy"


def test_allowed_origins_parsing():
    """Verify comma-separated and JSON string formats parse into clean origin lists."""
    # Comma-separated with trailing slashes
    s1 = Settings(
        ALLOWED_ORIGINS="https://my-app.vercel.app/,https://preview.vercel.app,http://localhost:5173/"
    )
    assert s1.ALLOWED_ORIGINS == [
        "https://my-app.vercel.app",
        "https://preview.vercel.app",
        "http://localhost:5173",
    ]

    # JSON array string
    s2 = Settings(
        ALLOWED_ORIGINS='["https://careerplatform.vercel.app/", "http://127.0.0.1:5173"]'
    )
    assert s2.ALLOWED_ORIGINS == [
        "https://careerplatform.vercel.app",
        "http://127.0.0.1:5173",
    ]


def test_production_rejects_default_jwt_secret():
    """Production cannot start with the public development signing secret."""
    with pytest.raises(ValueError, match="JWT_SECRET"):
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="development_secret_change_in_production_minimum_64_characters_random_hex",
        )


def test_migrations_derive_the_application_database_url():
    configured = Settings(_env_file=None, DATABASE_URL='postgres://user:pass@database.example/test?sslmode=require')
    assert configured.DATABASE_URL == 'postgresql+asyncpg://user:pass@database.example/test?ssl=require'
    assert configured.SYNC_DATABASE_URL == 'postgresql://user:pass@database.example/test?sslmode=require'


@pytest.mark.asyncio
async def test_production_does_not_log_or_store_email_secrets(capsys, monkeypatch):
    monkeypatch.setattr(settings, 'ENVIRONMENT', 'production')
    monkeypatch.setattr(settings, 'EMAIL_PROVIDER', 'console')
    EmailService.clear_dev_otps()
    assert await EmailService.send_otp_email('secret@example.com', '123456') is False
    assert await EmailService.send_password_reset_email('secret@example.com', 'secret-reset-token') is False
    assert EmailService.get_last_dev_otp('secret@example.com') is None
    assert EmailService.get_last_dev_reset_token('secret@example.com') is None
    output = capsys.readouterr()
    assert '123456' not in output.out + output.err
    assert 'secret-reset-token' not in output.out + output.err


@pytest.mark.asyncio
async def test_email_provider_errors_are_propagated(monkeypatch):
    monkeypatch.setattr(settings, 'EMAIL_PROVIDER', 'smtp')
    monkeypatch.setattr(settings, 'SMTP_HOST', 'smtp.example.com')
    monkeypatch.setattr('smtplib.SMTP', MagicMock(side_effect=OSError('unavailable')))
    assert await EmailService.send_otp_email('delivery@example.com', '123456') is False
    assert await EmailService.send_password_reset_email('delivery@example.com', 'reset-token') is False


@pytest.mark.asyncio
async def test_email_service_smtp_dispatch():
    """Verify SMTP email dispatch executes through smtplib with correct parameters."""
    with patch("smtplib.SMTP") as mock_smtp_cls, \
         patch.object(settings, "EMAIL_PROVIDER", "smtp"), \
         patch.object(settings, "SMTP_HOST", "smtp.example.com"), \
         patch.object(settings, "SMTP_PORT", 587), \
         patch.object(settings, "SMTP_USER", "user@example.com"), \
         patch.object(settings, "SMTP_PASSWORD", "secret_pass"), \
         patch.object(settings, "SMTP_USE_TLS", True):

        mock_server = MagicMock()
        mock_smtp_cls.return_value = mock_server

        success = await EmailService.send_otp_email(
            to_email="student@university.edu",
            otp_code="123456",
            recipient_name="Alex",
            purpose="registration",
        )

        assert success is True
        mock_smtp_cls.assert_called_once_with("smtp.example.com", 587, timeout=10)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("user@example.com", "secret_pass")
        assert mock_server.sendmail.called
        mock_server.quit.assert_called_once()


@pytest.mark.asyncio
async def test_email_service_resend_dispatch():
    """Verify Resend REST API email dispatch with authorization header."""
    mock_post = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_post.return_value = mock_response

    with patch("httpx.AsyncClient.post", mock_post), \
         patch.object(settings, "EMAIL_PROVIDER", "resend"), \
         patch.object(settings, "EMAIL_API_KEY", "re_test_key_12345"):

        success = await EmailService.send_otp_email(
            to_email="test_resend@university.edu",
            otp_code="654321",
            recipient_name="Sam",
            purpose="registration",
        )

        assert success is True
        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["headers"]["Authorization"] == "Bearer re_test_key_12345"
        assert "654321" in call_kwargs["json"]["html"]


@pytest.mark.asyncio
async def test_email_service_sendgrid_dispatch():
    """Verify SendGrid v3 API email dispatch with authorization and payload."""
    mock_post = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 202
    mock_response.raise_for_status = MagicMock()
    mock_post.return_value = mock_response

    with patch("httpx.AsyncClient.post", mock_post), \
         patch.object(settings, "EMAIL_PROVIDER", "sendgrid"), \
         patch.object(settings, "EMAIL_API_KEY", "SG.test_key_12345"):

        success = await EmailService.send_otp_email(
            to_email="test_sg@university.edu",
            otp_code="987654",
            recipient_name="Taylor",
            purpose="registration",
        )

        assert success is True
        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["headers"]["Authorization"] == "Bearer SG.test_key_12345"
        assert call_kwargs["json"]["personalizations"][0]["to"][0]["email"] == "test_sg@university.edu"


@pytest.mark.asyncio
async def test_email_service_console_fallback():
    """Verify Console provider logs OTP and updates dev registry."""
    with patch.object(settings, "EMAIL_PROVIDER", "console"):
        EmailService.clear_dev_otps()
        success = await EmailService.send_otp_email(
            to_email="console_test@university.edu",
            otp_code="112233",
            recipient_name="Console Student",
        )
        assert success is True
        assert EmailService.get_last_dev_otp("console_test@university.edu") == "112233"


@pytest.mark.asyncio
async def test_google_sign_in_new_user(client, db_session):
    """Verify Google Sign-In automatically creates and verifies a new student."""
    google_payload = {
        "email": "newgoogleuser@university.edu",
        "email_verified": True,
        "name": "Jordan Google",
        "picture": "https://lh3.googleusercontent.com/photo.jpg",
        "aud": "mock-google-client-id.apps.googleusercontent.com",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = google_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch.object(settings, "GOOGLE_CLIENT_ID", "mock-google-client-id.apps.googleusercontent.com"):
        mock_get.return_value = mock_resp

        res = await client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token_jwt_12345"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newgoogleuser@university.edu"
        assert data["user"]["full_name"] == "Jordan Google"
        assert data["user"]["is_verified"] is True
        assert data["user"]["role"] == "STUDENT"

        # Confirm in database
        stmt = select(User).where(User.email == "newgoogleuser@university.edu")
        user_in_db = (await db_session.execute(stmt)).scalar_one_or_none()
        assert user_in_db is not None
        assert user_in_db.is_verified is True


@pytest.mark.asyncio
async def test_google_sign_in_existing_user(client, db_session):
    """Verify Google Sign-In authenticates existing user without creating duplicates."""
    user = User(
        email="alexstudent@university.edu",
        hashed_password="hashed_pwd",
        full_name="Alex Student",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()

    google_payload = {
        "email": "alexstudent@university.edu",
        "email_verified": True,
        "name": "Alex Student",
        "aud": "mock-google-client-id.apps.googleusercontent.com",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = google_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch.object(settings, "GOOGLE_CLIENT_ID", "mock-google-client-id.apps.googleusercontent.com"):
        mock_get.return_value = mock_resp

        res = await client.post(
            "/api/auth/google",
            json={"credential": "mock_valid_token_for_student"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["email"] == "alexstudent@university.edu"


@pytest.mark.asyncio
async def test_google_sign_in_invalid_token(client):
    """Verify Google Sign-In rejects invalid token with 401."""
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error_description": "Invalid Value"}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch.object(settings, "GOOGLE_CLIENT_ID", "expected-client-id.apps.googleusercontent.com"):
        mock_get.return_value = mock_resp

        res = await client.post(
            "/api/auth/google",
            json={"credential": "invalid_fake_token_12345"},
        )
        assert res.status_code == 401


@pytest.mark.asyncio
async def test_google_sign_in_audience_mismatch(client):
    """Verify Google Sign-In rejects token with mismatched client ID."""
    google_payload = {
        "email": "mismatch@university.edu",
        "email_verified": True,
        "name": "Mismatch User",
        "aud": "wrong-client-id.apps.googleusercontent.com",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = google_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch.object(settings, "GOOGLE_CLIENT_ID", "expected-client-id.apps.googleusercontent.com"):
        mock_get.return_value = mock_resp

        res = await client.post(
            "/api/auth/google",
            json={"credential": "mismatched_aud_token_12345"},
        )
        assert res.status_code == 401
        assert "audience" in res.json()["detail"].lower()
