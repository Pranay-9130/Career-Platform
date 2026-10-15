import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.core.config import settings
from app.core.security import get_password_hash
from app.services.email_service import EmailService
from unittest.mock import AsyncMock

# Isolated in-memory async SQLite engine for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.mark.asyncio
async def test_public_registration_cannot_create_admin(client, db_session):
    response = await client.post("/api/auth/register", json={
        "email": "attacker@university.edu", "password": "StrongPassword123!",
        "full_name": "New User", "role": "ADMIN",
    })
    assert response.status_code == 422
    assert (await db_session.execute(select(User).where(User.email == "attacker@university.edu"))).scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_reserved_admin_email_cannot_be_registered(client):
    response = await client.post("/api/auth/register", json={
        "email": settings.ADMIN_EMAIL, "password": "StrongPassword123!",
        "full_name": "New User",
    })
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_username_login_and_role_access(client, db_session):
    admin = User(email=settings.ADMIN_EMAIL, full_name="Administrator", role=UserRole.ADMIN,
                 hashed_password=get_password_hash("TestAdminPassword123!"), is_active=True, is_verified=True)
    db_session.add(admin)
    await db_session.commit()
    response = await client.post("/api/auth/login", json={
        "email": settings.ADMIN_USERNAME, "password": "TestAdminPassword123!",
    })
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "ADMIN"
    access = await client.get("/api/auth/admin-only", headers={"Authorization": f"Bearer {response.json()['access_token']}"})
    assert access.status_code == 200


@pytest.mark.asyncio
async def test_admin_username_does_not_authenticate_student(client, db_session):
    student = User(email=settings.ADMIN_EMAIL, full_name="Student", role=UserRole.STUDENT,
                   hashed_password=get_password_hash("StudentPassword123!"), is_active=True)
    db_session.add(student)
    await db_session.commit()
    response = await client.post("/api/auth/login", json={
        "email": settings.ADMIN_USERNAME, "password": "StudentPassword123!",
    })
    assert response.status_code == 401

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
async def test_register_student_success(client):
    """User can successfully register with valid credentials."""
    payload = {
        "email": "student@university.edu",
        "password": "StrongPassword123!",
        "full_name": "Jordan Lee",
        "role": "STUDENT",
        "headline": "Junior Software Engineering Major",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student@university.edu"
    assert data["user"]["full_name"] == "Jordan Lee"
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["is_active"] is True
    assert data["user"]["is_verified"] is False


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client):
    """Registering with an already existing email returns HTTP 409 Conflict."""
    payload = {
        "email": "duplicate@university.edu",
        "password": "StrongPassword123!",
        "full_name": "First User",
    }
    resp1 = await client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 409
    data = resp2.json()
    assert "already exists" in data["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email_format(client):
    """Invalid email formats are rejected with HTTP 422 Unprocessable Entity."""
    payload = {
        "email": "not-an-email-address",
        "password": "StrongPassword123!",
        "full_name": "Invalid Email",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password_rejected(client):
    """Passwords with fewer than 8 characters must be rejected with 422."""
    payload = {
        "email": "weak@university.edu",
        "password": "short",
        "full_name": "Weak Pass User",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_blank_name_rejected(client):
    """Full names with fewer than 2 non-whitespace characters must be rejected with 422."""
    payload = {
        "email": "noname@university.edu",
        "password": "StrongPassword123!",
        "full_name": "   ",
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    """User can log in with registered credentials and receive a valid JWT."""
    # Register first
    await client.post(
        "/api/auth/register",
        json={
            "email": "login_user@university.edu",
            "password": "ValidPassword99#",
            "full_name": "Login Tester",
        },
    )

    # Login
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "login_user@university.edu",
            "password": "ValidPassword99#",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_user@university.edu"


@pytest.mark.asyncio
async def test_login_wrong_password_rejected(client):
    """Login with invalid password returns HTTP 401 Unauthorized."""
    await client.post(
        "/api/auth/register",
        json={
            "email": "wrong_pw@university.edu",
            "password": "CorrectPassword123!",
            "full_name": "Password Tester",
        },
    )

    response = await client.post(
        "/api/auth/login",
        json={
            "email": "wrong_pw@university.edu",
            "password": "IncorrectPassword",
        },
    )
    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_email_rejected(client):
    """Login with unknown email returns HTTP 401 Unauthorized."""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "ghost@university.edu",
            "password": "AnyPassword123!",
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_deactivated_account_rejected(client, db_session):
    """Deactivated accounts receive HTTP 400 Bad Request."""
    reg_response = await client.post(
        "/api/auth/register",
        json={
            "email": "deactivated@university.edu",
            "password": "Password123!",
            "full_name": "Deactivated User",
        },
    )
    assert reg_response.status_code == 201

    # Deactivate directly in database
    result = await db_session.execute(
        select(User).where(User.email == "deactivated@university.edu")
    )
    user = result.scalar_one()
    user.is_active = False
    await db_session.commit()

    # Attempt login
    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": "deactivated@university.edu",
            "password": "Password123!",
        },
    )
    assert login_response.status_code == 400
    assert "deactivated" in login_response.json()["detail"]


@pytest.mark.asyncio
async def test_register_and_access_protected_me_endpoint(client):
    """Token returned on register or login can successfully access /api/auth/me."""
    reg_response = await client.post(
        "/api/auth/register",
        json={
            "email": "me_test@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Me Tester",
        },
    )
    assert reg_response.status_code == 201
    token = reg_response.json()["access_token"]

    # Call /api/auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    profile = me_response.json()
    assert profile["email"] == "me_test@university.edu"
    assert profile["full_name"] == "Me Tester"


@pytest.mark.asyncio
async def test_refresh_rotates_cookie_and_returns_new_access_token(client):
    """A browser session can renew its short-lived access token using the HttpOnly cookie."""
    registration = await client.post(
        "/api/auth/register",
        json={
            "email": "refresh_user@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Refresh Tester",
        },
    )
    assert registration.status_code == 201
    assert "career_platform_refresh=" in registration.headers["set-cookie"]

    refreshed = await client.post("/api/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["user"]["email"] == "refresh_user@university.edu"
    assert refreshed.json()["access_token"] != registration.json()["access_token"]
    assert "HttpOnly" in refreshed.headers["set-cookie"]


@pytest.mark.asyncio
async def test_logout_clears_refresh_cookie(client):
    """Logout removes the refresh credential and prevents further renewal."""
    await client.post(
        "/api/auth/register",
        json={
            "email": "logout_user@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Logout Tester",
        },
    )

    logout = await client.post("/api/auth/logout")
    assert logout.status_code == 204
    assert "career_platform_refresh=" in logout.headers["set-cookie"]

    refresh = await client.post("/api/auth/refresh")
    assert refresh.status_code == 401


@pytest.mark.asyncio
async def test_rotated_and_logged_out_credentials_cannot_be_reused(client):
    registered = await client.post('/api/auth/register', json={
        'email': 'rotation@university.edu', 'password': 'SecurePassword123!', 'full_name': 'Session Tester',
    })
    original_cookie = client.cookies.get('career_platform_refresh')
    original_access = registered.json()['access_token']
    refreshed = await client.post('/api/auth/refresh')
    assert refreshed.status_code == 200
    current_cookie = client.cookies.get('career_platform_refresh')
    current_access = refreshed.json()['access_token']
    replay = await client.post('/api/auth/refresh', headers={'Cookie': f'career_platform_refresh={original_cookie}'})
    assert replay.status_code == 401
    assert (await client.get('/api/auth/me', headers={'Authorization': f'Bearer {original_access}'})).status_code == 401
    assert (await client.get('/api/auth/me', headers={'Authorization': f'Bearer {current_access}'})).status_code == 200
    await client.post('/api/auth/logout')
    assert (await client.get('/api/auth/me', headers={'Authorization': f'Bearer {current_access}'})).status_code == 401
    assert (await client.post('/api/auth/refresh', headers={'Cookie': f'career_platform_refresh={current_cookie}'})).status_code == 401


@pytest.mark.asyncio
async def test_password_reset_revokes_sessions_on_all_devices(client):
    email = 'revocation@university.edu'
    first = await client.post('/api/auth/register', json={
        'email': email, 'password': 'SecurePassword123!', 'full_name': 'Reset Tester',
    })
    first_cookie = client.cookies.get('career_platform_refresh')
    first_access = first.json()['access_token']
    second = await client.post('/api/auth/login', json={'email': email, 'password': 'SecurePassword123!'})
    second_access = second.json()['access_token']
    await client.post('/api/auth/forgot-password', json={'email': email})
    reset = await client.post('/api/auth/reset-password', json={
        'email': email, 'token': EmailService.get_last_dev_reset_token(email), 'new_password': 'NewPassword123!',
    })
    assert reset.status_code == 200
    for token in (first_access, second_access):
        assert (await client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})).status_code == 401
    assert (await client.post('/api/auth/refresh')).status_code == 401
    assert (await client.post('/api/auth/refresh', headers={'Cookie': f'career_platform_refresh={first_cookie}'})).status_code == 401
    assert (await client.post('/api/auth/login', json={'email': email, 'password': 'NewPassword123!'})).status_code == 200


@pytest.mark.asyncio
async def test_registration_does_not_depend_on_email_delivery(client, db_session, monkeypatch):
    send_otp = AsyncMock(return_value=False)
    monkeypatch.setattr(EmailService, 'send_otp_email', send_otp)
    response = await client.post('/api/auth/register', json={
        'email': 'delivery@university.edu', 'password': 'SecurePassword123!', 'full_name': 'Delivery Tester',
    })
    assert response.status_code == 201
    assert (await db_session.execute(select(User).where(User.email == 'delivery@university.edu'))).scalar_one_or_none() is not None
    send_otp.assert_not_awaited()


@pytest.mark.asyncio
async def test_cookie_session_rejects_untrusted_origin(client):
    for endpoint in ('/api/auth/refresh', '/api/auth/logout'):
        response = await client.post(endpoint, headers={'Origin': 'https://attacker.invalid'})
        assert response.status_code == 403
