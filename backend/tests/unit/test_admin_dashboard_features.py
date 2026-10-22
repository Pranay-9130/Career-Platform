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
from app.services.email_service import EmailService

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
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_jobs_crud_and_toggle(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a job with full requirements
    new_job_payload = {
        "title": "Lead Backend Platform Engineer",
        "company_name": "CloudScale Corp",
        "domain": "Software Engineering",
        "job_type": "Full-time",
        "work_mode": "Remote",
        "location": "Remote",
        "stipend_or_salary": "$140,000 - $175,000",
        "experience_level": "Mid-Level",
        "description": "Architect and scale distributed event-driven systems.",
        "requirements": ["5+ years Python/FastAPI", "PostgreSQL expertise", "Kubernetes"],
        "responsibilities": ["Lead core system design", "Mentor junior engineers"],
        "skills_required": ["Python", "FastAPI", "Docker", "Kubernetes"],
        "apply_url": "https://careers.cloudscale.io/jobs/lead-backend",
        "is_active": True,
        "is_featured": False,
    }
    create_res = await client.post("/api/admin/jobs", json=new_job_payload)
    assert create_res.status_code == 201
    created_job = create_res.json()
    job_id = created_job["id"]
    assert created_job["title"] == "Lead Backend Platform Engineer"
    assert created_job["requirements"] == ["5+ years Python/FastAPI", "PostgreSQL expertise", "Kubernetes"]

    # 2. Get all jobs in admin dashboard
    list_res = await client.get("/api/admin/jobs")
    assert list_res.status_code == 200
    jobs = list_res.json()
    assert any(j["id"] == job_id for j in jobs)

    # 3. Toggle status (unpublish / deactivate)
    toggle_res = await client.patch(f"/api/admin/jobs/{job_id}/toggle-status")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # 4. Toggle back (publish / activate)
    toggle_back_res = await client.patch(f"/api/admin/jobs/{job_id}/toggle-status")
    assert toggle_back_res.status_code == 200
    assert toggle_back_res.json()["is_active"] is True

    # 5. Edit job
    edit_payload = {
        **new_job_payload,
        "title": "Principal Backend Platform Engineer",
        "stipend_or_salary": "$180,000 - $210,000",
    }
    edit_res = await client.put(f"/api/admin/jobs/{job_id}", json=edit_payload)
    assert edit_res.status_code == 200
    assert edit_res.json()["title"] == "Principal Backend Platform Engineer"

    # 6. Delete job
    del_res = await client.delete(f"/api/admin/jobs/{job_id}")
    assert del_res.status_code == 204

    # Verify deleted
    verify_res = await client.get("/api/admin/jobs")
    assert all(j["id"] != job_id for j in verify_res.json())


@pytest.mark.asyncio
async def test_admin_students_list(client: AsyncClient, db_session: AsyncSession):
    db_session.add(student_user)
    await db_session.commit()

    res = await client.get("/api/admin/students")
    assert res.status_code == 200
    students = res.json()
    assert len(students) >= 1
    student_record = next((s for s in students if s["email"] == student_user.email), None)
    assert student_record is not None
    assert "projects_count" in student_record
    assert student_record["email"] == student_user.email


@pytest.mark.asyncio
async def test_admin_templates_crud(client: AsyncClient):
    # 1. List templates
    list_res = await client.get("/api/admin/templates")
    assert list_res.status_code == 200
    templates = list_res.json()
    assert templates == []

    # 2. Add custom template
    template_payload = {
        "id": "cloud-native-sre",
        "name": "Cloud Native SRE Format",
        "tagline": "Tailored for site reliability and cloud engineering roles.",
        "description": "High impact metrics layout with focus on uptime, latency, and Kubernetes infra.",
        "badge": "Popular",
        "ats_score": "96/100",
        "best_for": "SRE, DevOps Engineer, Cloud Architect",
        "preview_accent": "#0ea5e9",
    }
    create_res = await client.post("/api/admin/templates", json=template_payload)
    assert create_res.status_code == 201
    created_tpl = create_res.json()
    assert created_tpl["name"] == "Cloud Native SRE Format"
    template_id = created_tpl["id"]

    # 3. Check public or admin catalog reflects new template
    updated_res = await client.get("/api/admin/templates")
    assert any(t["id"] == template_id for t in updated_res.json())

    # 4. Delete custom template
    del_res = await client.delete(f"/api/admin/templates/{template_id}")
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_moderation_rejection_email_dispatched(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch
):
    db_session.add(admin_user)
    db_session.add(student_user)

    test_project = Project(
        owner_id=student_user.id,
        title="Pending ML Project",
        slug="pending-ml-project-email-test",
        domain="AI / Machine Learning",
        short_description="A project awaiting admin review",
        status="Submitted",
    )
    db_session.add(test_project)
    await db_session.commit()

    email_dispatched = {}

    async def mock_send_email(to_email, student_name, project_title, action, reviewer_notes):
        email_dispatched["to_email"] = to_email
        email_dispatched["student_name"] = student_name
        email_dispatched["project_title"] = project_title
        email_dispatched["action"] = action
        email_dispatched["reviewer_notes"] = reviewer_notes
        return True

    monkeypatch.setattr(EmailService, "send_project_moderation_email", mock_send_email)

    # Moderate with REJECT
    mod_payload = {
        "action": "reject",
        "reviewer_notes": "The architecture diagram and live deployment URL are missing. Please provide working live proof."
    }
    res = await client.post(
        f"/api/admin/projects/{test_project.slug}/moderate",
        json=mod_payload
    )
    assert res.status_code == 200
    assert res.json()["status"] == "Rejected"

    # Verify email dispatch called with correct student mail and reviewer comments
    assert email_dispatched["to_email"] == student_user.email
    assert email_dispatched["action"] == "reject"
    assert email_dispatched["reviewer_notes"] == mod_payload["reviewer_notes"]
