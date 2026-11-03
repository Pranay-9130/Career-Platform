import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.project import Project
from app.core.config import settings
from app.core.security import get_password_hash

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
async def test_admin_login_deterministic_priority(client, db_session):
    """Admin login with admin username matches primary configured admin email deterministically."""
    # Seed primary admin
    primary_admin = User(
        email=settings.ADMIN_EMAIL.strip().lower(),
        full_name="Primary Admin",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash("AdminPass123!"),
        is_active=True,
        is_verified=True,
    )
    # Seed secondary admin
    secondary_admin = User(
        email="admin@careerplatform.com",
        full_name="Secondary Admin",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash("DifferentPass123!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([primary_admin, secondary_admin])
    await db_session.commit()

    # Login with ADMIN_USERNAME and primary password succeeds deterministically
    resp = await client.post("/api/auth/login", json={
        "email": settings.ADMIN_USERNAME,
        "password": "AdminPass123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == settings.ADMIN_EMAIL.strip().lower()
    assert data["user"]["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_unauthenticated_protected_endpoint_rejects_without_token(client):
    """Protected endpoint rejects unauthenticated requests with 401 when token is missing."""
    resp = await client.get("/api/users/me")
    assert resp.status_code == 401
    assert "Authentication credentials were not provided." in resp.json()["detail"]


@pytest.mark.asyncio
async def test_admin_queue_loads_with_joined_profile(client, db_session):
    """Admin moderation queue executes with joinedload without row duplication."""
    admin = User(
        email=settings.ADMIN_EMAIL.strip().lower(),
        full_name="Admin",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash("AdminPass123!"),
        is_active=True,
        is_verified=True,
    )
    student = User(
        email="student@test.edu",
        full_name="Student Dev",
        role=UserRole.STUDENT,
        hashed_password=get_password_hash("StudentPass123!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([admin, student])
    await db_session.flush()

    profile = Profile(user_id=student.id, username="studentdev", skills=["Python", "React"])
    project = Project(
        owner_id=student.id,
        title="Portfolio Platform",
        slug="portfolio-platform",
        status="Submitted",
        short_description="Showcase website",
        problem_statement="Students need portfolios",
        features=["Auth", "Profile"],
        tech_stack=["React", "FastAPI"],
    )
    db_session.add_all([profile, project])
    await db_session.commit()

    login_resp = await client.post("/api/auth/login", json={
        "email": settings.ADMIN_USERNAME,
        "password": "AdminPass123!",
    })
    token = login_resp.json()["access_token"]

    queue_resp = await client.get(
        "/api/admin/projects/queue?status_filter=Submitted",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert queue_resp.status_code == 200
    projects = queue_resp.json()
    assert len(projects) == 1
    assert projects[0]["slug"] == "portfolio-platform"
    assert projects[0]["author_username"] == "studentdev"
    assert projects[0]["author_name"] == "Student Dev"
