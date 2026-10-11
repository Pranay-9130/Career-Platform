import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
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
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_unauthenticated_get_me_rejected(client):
    """Unauthenticated calls to /users/me return 401."""
    response = await client.get("/api/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_get_me_initializes_profile(client):
    """Authenticated user automatically gets a lazily initialized profile."""
    # 1. Register student
    reg_payload = {
        "email": "sarah.connor@university.edu",
        "password": "Password123!",
        "full_name": "Sarah Connor",
        "role": "STUDENT",
        "headline": "Systems Engineering Junior",
    }
    reg_res = await client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]

    # 2. Fetch /users/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/users/me", headers=headers)
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == "sarah.connor@university.edu"
    assert data["full_name"] == "Sarah Connor"
    assert "username" in data
    assert data["completion_percentage"] > 0


@pytest.mark.asyncio
async def test_update_profile_persists_changes(client):
    """Updating student profile fields updates database and recalculates completion %."""
    # 1. Register
    reg_payload = {
        "email": "alex.dev@university.edu",
        "password": "Password123!",
        "full_name": "Alex Developer",
    }
    reg_res = await client.post("/api/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update profile
    update_payload = {
        "headline": "Full-Stack Engineer in Training",
        "bio": "Building scalable web applications with FastAPI, React, and PostgreSQL. Passionate about cloud architecture.",
        "university": "Stanford University",
        "degree": "B.S. in Computer Science",
        "graduation_year": 2026,
        "github_url": "https://github.com/alexdev",
        "linkedin_url": "https://linkedin.com/in/alexdev",
        "portfolio_url": "https://alexdev.me",
        "skills": ["Python", "FastAPI", "React", "Docker", "Tailwind CSS"],
    }
    put_res = await client.put("/api/users/me", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    data = put_res.json()

    assert data["headline"] == "Full-Stack Engineer in Training"
    assert data["university"] == "Stanford University"
    assert data["degree"] == "B.S. in Computer Science"
    assert data["graduation_year"] == 2026
    assert data["github_url"] == "https://github.com/alexdev"
    assert len(data["skills"]) == 5
    assert data["completion_percentage"] >= 80


@pytest.mark.asyncio
async def test_update_profile_duplicate_username_rejected(client):
    """Attempting to claim an existing username returns 400 Bad Request."""
    # Register user 1
    u1 = await client.post("/api/auth/register", json={
        "email": "user1@university.edu",
        "password": "Password123!",
        "full_name": "User One",
    })
    token1 = u1.json()["access_token"]
    await client.put(
        "/api/users/me",
        json={"username": "superstar_coder"},
        headers={"Authorization": f"Bearer {token1}"},
    )

    # Register user 2
    u2 = await client.post("/api/auth/register", json={
        "email": "user2@university.edu",
        "password": "Password123!",
        "full_name": "User Two",
    })
    token2 = u2.json()["access_token"]

    # User 2 tries to claim same username
    res = await client.put(
        "/api/users/me",
        json={"username": "superstar_coder"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert res.status_code == 400
    assert "already taken" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_public_profile(client):
    """Public profile is accessible anonymously via /api/users/{username}."""
    # Register student
    reg = await client.post("/api/auth/register", json={
        "email": "public.student@university.edu",
        "password": "Password123!",
        "full_name": "Public Student",
    })
    token = reg.json()["access_token"]

    # Set custom username
    await client.put(
        "/api/users/me",
        json={"username": "janedoe", "headline": "AI & Web Developer"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Fetch publicly without token
    res = await client.get("/api/users/janedoe")
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "janedoe"
    assert data["full_name"] == "Public Student"
    assert data["headline"] == "AI & Web Developer"
    assert isinstance(data["projects"], list)


@pytest.mark.asyncio
async def test_get_nonexistent_public_profile_returns_404(client):
    """Requesting non-existent username returns 404."""
    res = await client.get("/api/users/nobody_here_9999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
