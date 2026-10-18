import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.api.dependencies.auth import get_current_active_user

from datetime import datetime, timezone

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

mock_active_student = User(
    id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
    email="student_dash@university.edu",
    hashed_password="hash",
    full_name="Taylor Student",
    role=UserRole.STUDENT,
    headline="Computer Science Senior",
    is_active=True,
    is_verified=True,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)

mock_unverified_student = User(
    id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
    email="unverified@university.edu",
    hashed_password="hash",
    full_name="Jordan Learner",
    role=UserRole.STUDENT,
    headline="First Year Student",
    is_active=True,
    is_verified=False,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)

@pytest.mark.asyncio
async def test_unauthenticated_dashboard_rejected():
    """Unauthenticated requests to dashboard summary are rejected with 401."""
    app.dependency_overrides.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/dashboard-summary")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_student_receives_dashboard_summary(db_session):
    """Authenticated student successfully receives personalized statistics and recommendations."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_active_student
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/dashboard-summary")
        assert response.status_code == 200
        data = response.json()

        # User Profile
        assert data["user"]["email"] == "student_dash@university.edu"
        assert data["user"]["full_name"] == "Taylor Student"

        # High-level Metrics
        stats = data["stats"]
        assert "projects_count" in stats
        assert "resume_completion_percentage" in stats
        assert "ats_score" in stats
        assert "active_applications_count" in stats

        # Recent Activity Feed
        activities = data["recent_activity"]
        assert isinstance(activities, list)
        assert len(activities) > 0

        # Recommended Opportunities
        recs = data["recommended_opportunities"]
        assert isinstance(recs, list)
        assert len(recs) >= 2

        # Readiness
        assert data["readiness_score"] > 0
        assert "Stage" in data["readiness_stage"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_unverified_student_receives_profile_setup_stage(db_session):
    """Unverified student dashboard reflects initial onboarding stage and advice."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_unverified_student
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/dashboard-summary")
        assert response.status_code == 200
        data = response.json()
        assert data["readiness_stage"] == "Stage 1: Profile Setup"
        assert data["stats"]["projects_count"] == 0

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_brand_new_student_transparent_readiness_model(db_session):
    """Brand new student starts with transparent data-driven score, no fake baseline, and accurate criteria."""
    new_student = User(
        id=uuid.UUID("55555555-5555-5555-5555-555555555555"),
        email="newcomer@university.edu",
        hashed_password="hash",
        full_name="New Student",
        role=UserRole.STUDENT,
        headline=None,
        is_active=True,
        is_verified=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    app.dependency_overrides[get_current_active_user] = lambda: new_student
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/dashboard-summary")
        assert response.status_code == 200
        data = response.json()

        # Score is legitimate data-driven score (only name = 5 pts, no 25 or 55 fake baseline)
        assert data["readiness_score"] == 5
        assert data["readiness_stage"] == "Stage 1: Profile Setup"
        assert data["stats"]["projects_count"] == 0
        assert data["stats"]["ats_score"] is None
        assert data["stats"]["active_applications_count"] == 0
        assert data["has_resume"] is False

        # Verify Readiness Details & 5 Criteria Breakdown
        assert "readiness_details" in data
        details = data["readiness_details"]
        assert details["stage_number"] == 1
        assert details["recommended_action_link"] == "/profile"

        criteria = details["criteria"]
        assert len(criteria) == 5
        weights_sum = sum(c["weight"] for c in criteria)
        assert weights_sum == 100

        crit_ids = [c["id"] for c in criteria]
        assert crit_ids == ["profile", "resume", "skills", "projects", "applications"]

        # Only profile has partial points from name (5/20); others are 0
        crit_by_id = {c["id"]: c for c in criteria}
        assert crit_by_id["profile"]["score"] == 5
        assert crit_by_id["resume"]["score"] == 0
        assert crit_by_id["skills"]["score"] == 0
        assert crit_by_id["projects"]["score"] == 0
        assert crit_by_id["applications"]["score"] == 0

    app.dependency_overrides.clear()

