import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.job import Job
from app.api.dependencies.auth import get_current_active_user

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

admin_user = User(
    id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
    email="admin@careerplatform.com",
    hashed_password="hash",
    full_name="Morgan Admin",
    role=UserRole.ADMIN,
    is_active=True,
    is_verified=True,
)

student_user = User(
    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
    email="student@university.edu",
    hashed_password="hash",
    full_name="Alex Student",
    role=UserRole.STUDENT,
    is_active=True,
    is_verified=True,
)


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
async def test_unauthenticated_admin_access_rejected(client):
    """Unauthenticated requests to admin routes are rejected with HTTP 401."""
    resp = await client.get("/api/admin/stats")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_student_role_forbidden_from_admin(client):
    """Students accessing admin endpoints receive HTTP 403 Forbidden."""
    app.dependency_overrides[get_current_active_user] = lambda: student_user
    resp = await client.get("/api/admin/stats")
    assert resp.status_code == 403
    assert "Required role: 'ADMIN'" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_admin_stats_and_queue(client, db_session):
    """Admin can query platform metrics and submitted projects in the moderation queue."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    # Seed data
    db_session.add(admin_user)
    db_session.add(student_user)

    p_sub = Project(
        owner_id=student_user.id,
        title="Pending ML Project",
        slug="pending-ml-project",
        domain="AI / Machine Learning",
        short_description="A project awaiting admin review",
        status="Submitted",
    )
    p_pub = Project(
        owner_id=student_user.id,
        title="Published Web App",
        slug="published-web-app",
        domain="Web Development",
        short_description="An already approved project",
        status="Published",
    )
    job = Job(
        title="Frontend Intern",
        company_name="Acme Corp",
        apply_url="https://acme.com",
        is_active=True,
    )
    db_session.add_all([p_sub, p_pub, job])
    await db_session.commit()

    # 1. Test Admin Stats
    stats_resp = await client.get("/api/admin/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["pending_submissions"] == 1
    assert stats["published_projects"] == 1
    assert stats["total_students"] == 1
    assert stats["total_jobs"] == 1

    # 2. Test Moderation Queue
    queue_resp = await client.get("/api/admin/projects/queue")
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    assert len(queue) == 1
    assert queue[0]["title"] == "Pending ML Project"
    assert queue[0]["status"] == "Submitted"


@pytest.mark.asyncio
async def test_moderate_project_approve(client, db_session):
    """Admin approving a project marks it as Published with published_at timestamp."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    db_session.add(student_user)
    project = Project(
        owner_id=student_user.id,
        title="Capstone Submission",
        slug="capstone-submission",
        short_description="Student capstone submission ready for review",
        status="Submitted",
    )
    db_session.add(project)
    await db_session.commit()

    resp = await client.post(
        f"/api/admin/projects/{project.id}/moderate",
        json={"action": "approve", "reviewer_notes": "Outstanding work! Approved for public catalog."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Published"
    assert data["published_at"] is not None
    assert "Outstanding work!" in data["reviewer_notes"]


@pytest.mark.asyncio
async def test_moderate_project_request_changes(client, db_session):
    """Admin requesting changes marks status as 'Changes Requested' with reviewer notes."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    db_session.add(student_user)
    project = Project(
        owner_id=student_user.id,
        title="Incomplete Demo",
        slug="incomplete-demo",
        short_description="Project missing live demo url and screenshots",
        status="Submitted",
    )
    db_session.add(project)
    await db_session.commit()

    resp = await client.post(
        f"/api/admin/projects/{project.slug}/moderate",
        json={
            "action": "request_changes",
            "reviewer_notes": "Please attach at least 2 screenshots and add your GitHub repository link.",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Changes Requested"
    assert "Please attach at least 2 screenshots" in data["reviewer_notes"]


@pytest.mark.asyncio
async def test_moderate_project_reject(client, db_session):
    """Admin rejecting a project marks status as 'Rejected' with reason."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    db_session.add(student_user)
    project = Project(
        owner_id=student_user.id,
        title="Spam Submission",
        slug="spam-submission",
        short_description="Inappropriate content",
        status="Submitted",
    )
    db_session.add(project)
    await db_session.commit()

    resp = await client.post(
        f"/api/admin/projects/{project.id}/moderate",
        json={"action": "reject", "reviewer_notes": "Violates submission community guidelines."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Rejected"
    assert "Violates submission community guidelines." in data["reviewer_notes"]


@pytest.mark.asyncio
async def test_moderate_nonexistent_project_returns_404(client):
    """Attempting to moderate a non-existent project returns 404."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    fake_id = uuid.uuid4()
    resp = await client.post(
        f"/api/admin/projects/{fake_id}/moderate",
        json={"action": "approve"},
    )
    assert resp.status_code == 404
