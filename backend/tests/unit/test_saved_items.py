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
from app.models.project_bookmark import ProjectBookmark
from app.models.job_bookmark import JobBookmark
from app.api.dependencies.auth import get_current_active_user

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

student_user = User(
    id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
    email="student_saved@university.edu",
    hashed_password="hash",
    full_name="Alex Saved",
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
async def test_job_bookmark_toggle_and_listing(client, db_session):
    """Student can toggle job bookmarks and view them in /api/jobs/bookmarks/my."""
    app.dependency_overrides[get_current_active_user] = lambda: student_user

    db_session.add(student_user)
    job = Job(
        title="Full Stack Engineer",
        company_name="Vercel",
        domain="Frontend",
        job_type="Full-time",
        work_mode="Remote",
        apply_url="https://vercel.com",
        is_active=True,
    )
    db_session.add(job)
    await db_session.commit()

    # 1. Bookmark the job (POST)
    resp_bm = await client.post(f"/api/jobs/{job.id}/bookmark")
    assert resp_bm.status_code == 200
    assert resp_bm.json()["bookmarked"] is True

    # 2. Query saved jobs list
    resp_my = await client.get("/api/jobs/bookmarks/my")
    assert resp_my.status_code == 200
    saved_jobs = resp_my.json()
    assert len(saved_jobs) == 1
    assert saved_jobs[0]["id"] == str(job.id)
    assert saved_jobs[0]["is_bookmarked"] is True

    # 3. Toggle off bookmark
    resp_unbm = await client.post(f"/api/jobs/{job.id}/bookmark")
    assert resp_unbm.status_code == 200
    assert resp_unbm.json()["bookmarked"] is False

    # 4. Saved jobs list should now be empty
    resp_empty = await client.get("/api/jobs/bookmarks/my")
    assert resp_empty.status_code == 200
    assert len(resp_empty.json()) == 0


@pytest.mark.asyncio
async def test_project_and_job_saved_workspace(client, db_session):
    """Verifies student can save both projects and jobs and retrieve both collections."""
    app.dependency_overrides[get_current_active_user] = lambda: student_user

    db_session.add(student_user)
    proj = Project(
        owner_id=student_user.id,
        title="Neural Style Transfer",
        slug="neural-style-transfer",
        short_description="PyTorch implementation",
        status="Published",
    )
    job = Job(
        title="Machine Learning Engineer",
        company_name="DeepMind",
        apply_url="https://deepmind.google",
        is_active=True,
    )
    db_session.add_all([proj, job])
    await db_session.commit()

    # Bookmark project
    resp_p = await client.post(f"/api/projects/{proj.id}/bookmark")
    assert resp_p.status_code == 200
    assert resp_p.json()["bookmarked"] is True

    # Bookmark job
    resp_j = await client.post(f"/api/jobs/{job.id}/bookmark")
    assert resp_j.status_code == 200
    assert resp_j.json()["bookmarked"] is True

    # Verify both endpoints return the saved items
    my_p = await client.get("/api/projects/bookmarks/my")
    assert my_p.status_code == 200
    assert len(my_p.json()) == 1
    assert my_p.json()[0]["slug"] == "neural-style-transfer"

    my_j = await client.get("/api/jobs/bookmarks/my")
    assert my_j.status_code == 200
    assert len(my_j.json()) == 1
    assert my_j.json()[0]["company_name"] == "DeepMind"
