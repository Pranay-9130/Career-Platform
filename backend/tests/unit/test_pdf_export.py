import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.resume import Resume
from app.api.dependencies.auth import get_current_active_user
from app.services.pdf_generator import generate_resume_pdf

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


def test_generate_resume_pdf_direct_all_templates():
    """Verify ReportLab PDF engine renders valid ATS-compliant vector PDF across all 4 templates."""
    sample_data = {
        "title": "Full Stack Engineer Resume",
        "personal_info": {
            "full_name": "Alex Rivera",
            "headline": "Cloud Software Engineer",
            "email": "alex.rivera@example.com",
            "phone": "+1 555-019-2834",
            "location": "Seattle, WA",
            "github": "github.com/alexrivera",
            "linkedin": "linkedin.com/in/alexrivera",
        },
        "summary": "Versatile engineer with strong systems background and high-performance API design.",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
        "education": [
            {
                "institution": "University of Washington",
                "degree": "B.S. in Computer Science",
                "end_date": "2025",
                "gpa": "3.85 / 4.0",
                "highlights": "Distributed Systems, Operating Systems, Algorithms",
            }
        ],
        "experience": [
            {
                "role": "Software Engineering Intern",
                "company": "CloudNova Systems",
                "location": "Remote",
                "start_date": "May 2024",
                "end_date": "Aug 2024",
                "bullets": [
                    "Engineered asynchronous endpoints cutting P95 latency by 32%.",
                    "Automated real-time event notifications with 99.9% reliability.",
                ],
            }
        ],
        "projects": [
            {
                "name": "NexusFlow PubSub",
                "tech_stack": "FastAPI, Redis, Docker",
                "link": "github.com/developer/nexusflow",
                "bullets": ["Handled 2,000 concurrent socket connections."],
            }
        ],
        "certifications": [
            {"name": "AWS Certified Cloud Practitioner", "issuer": "AWS", "date": "2024"}
        ],
    }

    for tid in ["classic-tech", "modern-minimal", "research-academic", "compact-dense"]:
        sample_data["template_id"] = tid
        pdf_bytes = generate_resume_pdf(sample_data)
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1000
        assert pdf_bytes.startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_unauthenticated_export_pdf_rejected(client):
    """Unauthenticated export request returns 401."""
    random_id = uuid.uuid4()
    resp = await client.get(f"/api/resumes/{random_id}/export-pdf")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_export_resume_pdf_endpoint(client, db_session):
    """Authenticated student can export their ATS resume as binary PDF with attachment header."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    db_session.add(student_1)

    resume = Resume(
        user_id=student_1.id,
        title="Production SRE Resume",
        template_id="classic-tech",
        personal_info={
            "full_name": "Alex Rivera",
            "email": "alex@university.edu",
            "phone": "555-019-2834",
        },
        summary="SRE and Cloud Engineer.",
        skills=["Linux", "Kubernetes", "Python"],
        education=[{"institution": "UW", "degree": "BS CS", "end_date": "2024"}],
        experience=[{"role": "DevOps Intern", "company": "Acme", "bullets": ["Maintained clusters"]}],
        projects=[{"name": "ClusterWatch", "tech_stack": "Go, Prometheus"}],
        is_primary=True,
    )
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)

    resp = await client.get(f"/api/resumes/{resume.id}/export-pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "attachment;" in resp.headers.get("content-disposition", "")
    assert "Alex_Rivera_ATS_Resume.pdf" in resp.headers.get("content-disposition", "")
    assert resp.content.startswith(b"%PDF-")


@pytest.mark.asyncio
async def test_export_pdf_cross_user_isolation(client, db_session):
    """Student 2 cannot download Student 1's PDF."""
    db_session.add_all([student_1, student_2])
    resume = Resume(
        user_id=student_1.id,
        title="Alex Secret Resume",
        template_id="modern-minimal",
        personal_info={"full_name": "Alex Rivera"},
    )
    db_session.add(resume)
    await db_session.commit()
    await db_session.refresh(resume)

    # Act as student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2
    resp = await client.get(f"/api/resumes/{resume.id}/export-pdf")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_preview_pdf_endpoint(client, db_session):
    """Authenticated user can stream live preview PDF without saving to DB."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    payload = {
        "title": "Draft Preview Resume",
        "template_id": "compact-dense",
        "personal_info": {
            "full_name": "Alex Rivera",
            "email": "alex@test.com",
        },
        "summary": "Fast learner looking for internships.",
        "skills": ["JavaScript", "React"],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
    }

    resp = await client.post("/api/resumes/preview-pdf", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF-")
