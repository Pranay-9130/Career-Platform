import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.user import User, UserRole
from app.api.dependencies.auth import get_current_active_user

from datetime import datetime, timezone

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
async def test_authenticated_student_receives_dashboard_summary():
    """Authenticated student successfully receives personalized statistics and recommendations."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_active_student
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
async def test_unverified_student_receives_profile_setup_stage():
    """Unverified student dashboard reflects initial onboarding stage and advice."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_unverified_student
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users/dashboard-summary")
        assert response.status_code == 200
        data = response.json()
        assert data["readiness_stage"] == "Stage 1: Profile Setup"
        assert data["stats"]["projects_count"] == 0

    app.dependency_overrides.clear()
