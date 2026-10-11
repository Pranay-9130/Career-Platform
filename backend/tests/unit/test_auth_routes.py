import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole

# Isolated in-memory async SQLite engine for testing
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
