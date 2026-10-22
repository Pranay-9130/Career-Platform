import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
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
async def test_create_internal_application_job(client):
    """Admin creates a job configured with internal application workflow."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    payload = {
        "title": "Junior Python Backend Developer",
        "company_name": "NexusScale",
        "domain": "Software Engineering",
        "job_type": "Full-time",
        "work_mode": "Remote",
        "description": "Develop high throughput async microservices.",
        "application_method": "INTERNAL",
        "application_instructions": "Submit directly through CareerPlatform with your verified projects.",
    }
    resp = await client.post("/api/admin/jobs", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["application_method"] == "INTERNAL"
    assert data["application_instructions"] == "Submit directly through CareerPlatform with your verified projects."
    assert data["application_url"] is None
    assert data["recruiter_email"] is None


@pytest.mark.asyncio
async def test_create_and_edit_google_form_job(client):
    """Admin creates and updates a job with an external Google Form."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    payload = {
        "title": "Frontend Engineering Intern",
        "company_name": "Acme Studios",
        "domain": "Frontend",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "description": "Build interactive student portals.",
        "application_method": "GOOGLE_FORM",
        "application_url": "https://forms.gle/sampleResponseForm123",
        "application_instructions": "Submit your resume and academic details through the company's Google Form.",
    }
    resp = await client.post("/api/admin/jobs", json=payload)
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    assert resp.json()["application_method"] == "GOOGLE_FORM"
    assert resp.json()["application_url"] == "https://forms.gle/sampleResponseForm123"

    # Edit Google Form URL
    update_payload = {
        "application_url": "https://docs.google.com/forms/d/e/1FAIpQLSc_sampleForm456/viewform",
    }
    resp_update = await client.put(f"/api/admin/jobs/{job_id}", json=update_payload)
    assert resp_update.status_code == 200
    assert resp_update.json()["application_url"] == "https://docs.google.com/forms/d/e/1FAIpQLSc_sampleForm456/viewform"


@pytest.mark.asyncio
async def test_create_and_edit_recruiter_email_job(client):
    """Admin creates and updates a job with recruiter email method."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    payload = {
        "title": "Machine Learning Engineer",
        "company_name": "DeepCognition",
        "domain": "AI / Machine Learning",
        "job_type": "Full-time",
        "work_mode": "Remote",
        "description": "Fine-tune open weights models.",
        "application_method": "EMAIL",
        "recruiter_email": "Careers@DeepCognition.ai",
        "application_instructions": "Include your GitHub profile and project links in the email body.",
    }
    resp = await client.post("/api/admin/jobs", json=payload)
    assert resp.status_code == 201
    job_id = resp.json()["id"]
    # Email should be normalized to lowercase
    assert resp.json()["recruiter_email"] == "careers@deepcognition.ai"
    assert resp.json()["apply_url"] == "mailto:careers@deepcognition.ai"

    # Update email address
    update_resp = await client.put(
        f"/api/admin/jobs/{job_id}",
        json={"recruiter_email": "hiring.manager@deepcognition.ai"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["recruiter_email"] == "hiring.manager@deepcognition.ai"


@pytest.mark.asyncio
async def test_create_external_website_job(client):
    """Admin creates a job directing to external application website."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    payload = {
        "title": "Cloud Operations Associate",
        "company_name": "SkyHigh Tech",
        "domain": "Cloud & DevOps",
        "job_type": "Full-time",
        "work_mode": "Onsite",
        "description": "Manage Kubernetes clusters and CI/CD pipelines.",
        "application_method": "EXTERNAL_URL",
        "application_url": "https://skyhigh.careers/apply/devops-associate",
        "application_instructions": "Complete the online aptitude assessment on our portal.",
    }
    resp = await client.post("/api/admin/jobs", json=payload)
    assert resp.status_code == 201
    assert resp.json()["application_method"] == "EXTERNAL_URL"
    assert resp.json()["application_url"] == "https://skyhigh.careers/apply/devops-associate"


@pytest.mark.asyncio
async def test_validation_rejects_unsafe_urls_and_invalid_emails(client):
    """Validation rejects insecure schemes, malicious javascript URLs, and malformed emails."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    base_job = {
        "title": "Security Analyst",
        "company_name": "SafeCorp",
        "domain": "Cybersecurity",
        "description": "Analyze network telemetry.",
    }

    # 1. Unsafe javascript: scheme in application_url
    resp_js = await client.post(
        "/api/admin/jobs",
        json={
            **base_job,
            "application_method": "EXTERNAL_URL",
            "application_url": "javascript:alert('xss')",
        },
    )
    assert resp_js.status_code == 422

    # 2. Insecure http:// URL
    resp_http = await client.post(
        "/api/admin/jobs",
        json={
            **base_job,
            "application_method": "EXTERNAL_URL",
            "application_url": "http://insecure-site.com/apply",
        },
    )
    assert resp_http.status_code == 422

    # 3. Non-Google Forms URL passed for GOOGLE_FORM method
    resp_bad_gf = await client.post(
        "/api/admin/jobs",
        json={
            **base_job,
            "application_method": "GOOGLE_FORM",
            "application_url": "https://not-a-google-form.com/form",
        },
    )
    assert resp_bad_gf.status_code == 422

    # 4. Malformed email address
    resp_bad_email = await client.post(
        "/api/admin/jobs",
        json={
            **base_job,
            "application_method": "EMAIL",
            "recruiter_email": "not-an-email-address",
        },
    )
    assert resp_bad_email.status_code == 422


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_create_or_edit(client):
    """Students and unauthenticated callers cannot create or edit job application settings."""
    app.dependency_overrides[get_current_active_user] = lambda: student_user
    payload = {
        "title": "Hacker Job",
        "company_name": "Unauthorized Inc",
        "description": "Unauthorized attempt.",
        "application_method": "INTERNAL",
    }
    resp_student = await client.post("/api/admin/jobs", json=payload)
    assert resp_student.status_code == 403

    resp_public = await client.post("/api/jobs", json=payload)
    assert resp_public.status_code == 403


@pytest.mark.asyncio
async def test_legacy_job_defaults_to_internal_application(client, db_session):
    """A legacy job stored in DB without explicit application_method defaults gracefully to INTERNAL."""
    legacy_job = Job(
        title="Legacy Software Developer",
        company_name="Vintage Tech",
        domain="Software Engineering",
        description="Legacy platform maintenance.",
        apply_url="https://vintage.com/old-apply",
        is_active=True,
    )
    db_session.add(legacy_job)
    await db_session.commit()

    # Public get
    resp = await client.get(f"/api/jobs/{legacy_job.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["application_method"] == "INTERNAL"
    assert data["title"] == "Legacy Software Developer"
