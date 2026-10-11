import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.models.job import Job
from app.api.dependencies.auth import get_current_active_user
from app.services.ats_analyzer import analyze_ats, _gemini_analysis

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

student_1 = User(
    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
    email="student1@university.edu",
    hashed_password="hash",
    full_name="Alex Rivera",
    role=UserRole.STUDENT,
    is_active=True,
    is_verified=True,
)

student_2 = User(
    id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
    email="student2@university.edu",
    hashed_password="hash",
    full_name="Sam Taylor",
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
async def test_unauthenticated_analyze_rejected(client):
    """Unauthenticated request to analyze-ats returns 401."""
    resp = await client.post("/api/resumes/analyze-ats", json={"resume_text": "...", "job_description": "..."})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_missing_inputs_rejected(client, db_session):
    """Returns 400 if resume or JD inputs are missing."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    # Missing job description
    resp1 = await client.post("/api/resumes/analyze-ats", json={"resume_text": "Experienced Python Engineer"})
    assert resp1.status_code == 400

    # Missing resume text
    resp2 = await client.post("/api/resumes/analyze-ats", json={"job_description": "Seeking Python Engineer"})
    assert resp2.status_code == 400


@pytest.mark.asyncio
async def test_analyze_with_raw_text(client):
    """Student can analyze raw resume text against custom job description."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    payload = {
        "resume_text": (
            "Alex Rivera\n"
            "Technical Skills: Python, FastAPI, React, Docker, PostgreSQL\n"
            "Experience: Software Engineer at NovaTech. Architected APIs cutting latency by 35%.\n"
            "Education: B.S. in Computer Science\n"
        ),
        "job_description": (
            "Job Title: Backend Developer\n"
            "Requirements: Strong experience in Python, FastAPI, PostgreSQL, Kubernetes, and AWS.\n"
        ),
    }

    resp = await client.post("/api/resumes/analyze-ats", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "overall_score" in data
    assert 0 <= data["overall_score"] <= 100
    assert "verdict" in data
    assert "breakdown" in data
    assert data["breakdown"]["skills_score"] > 0
    assert "matched_skills" in data
    assert "missing_skills" in data
    # Python & FastAPI & PostgreSQL should be matched
    matched_lower = [m.lower() for m in data["matched_skills"]]
    assert "python" in matched_lower
    assert "fastapi" in matched_lower
    assert "postgresql" in matched_lower
    # Kubernetes & AWS should be missing
    missing_lower = [m.lower() for m in data["missing_skills"]]
    assert "kubernetes" in missing_lower
    assert "aws" in missing_lower
    assert len(data["bullet_recommendations"]) >= 1


@pytest.mark.asyncio
async def test_analyze_with_saved_resume_and_job_id(client, db_session):
    """Student can analyze their saved resume entity against an active platform job listing."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    db_session.add(student_1)

    # 1. Create a saved resume for student 1
    resume = Resume(
        user_id=student_1.id,
        title="Full Stack Resume",
        template_id="classic-tech",
        personal_info={"full_name": "Alex Rivera", "email": "alex@example.com"},
        summary="Experienced Full Stack Engineer with focus on Python and React.",
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        experience=[
            {
                "role": "Frontend Intern",
                "company": "Acme Corp",
                "bullets": ["Optimized page rendering by 40%."],
            }
        ],
        education=[{"institution": "UW", "degree": "B.S. in CS"}],
        projects=[{"name": "App", "tech_stack": "Python, React"}],
        is_primary=True,
    )
    db_session.add(resume)

    # 2. Create a platform job
    job = Job(
        title="Cloud Software Engineer",
        company_name="CloudNova Systems",
        domain="Software Engineering",
        job_type="Full-time",
        work_mode="Remote",
        location="Remote",
        apply_url="https://cloudnova.com/jobs/1",
        skills_required=["Python", "FastAPI", "Docker", "AWS", "Kubernetes"],
        description="Looking for an engineer to build distributed systems in Python and FastAPI.",
        responsibilities=["Develop microservices", "Manage cloud deployments"],
        requirements=["3+ years experience with Python", "Hands on Docker and AWS"],
        is_active=True,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(resume)
    await db_session.refresh(job)

    # 3. Analyze using UUIDs
    resp = await client.post(
        "/api/resumes/analyze-ats",
        json={"resume_id": str(resume.id), "job_id": str(job.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_score"] >= 40
    matched_lower = [m.lower() for m in data["matched_skills"]]
    assert "python" in matched_lower
    assert "fastapi" in matched_lower
    assert "docker" in matched_lower


@pytest.mark.asyncio
async def test_cross_user_resume_analysis_isolated(client, db_session):
    """Student 2 cannot run analysis against Student 1's saved resume."""
    db_session.add_all([student_1, student_2])
    resume = Resume(
        user_id=student_1.id,
        title="Alex Rivera Private Resume",
        template_id="modern-minimal",
        personal_info={"full_name": "Alex Rivera"},
    )
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)

    # Act as Student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2
    resp = await client.post(
        "/api/resumes/analyze-ats",
        json={"resume_id": str(resume.id), "job_description": "General Software Engineer"},
    )
    assert resp.status_code == 404
