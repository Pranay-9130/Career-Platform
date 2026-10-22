import io
import zipfile
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.services.email_service import EmailService
from app.models.user import User, UserRole
from app.models.job import Job

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


def create_valid_zip_bytes():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("README.md", "# Sample Student Project\nBuilt with Python & React.")
        zf.writestr("main.py", "print('Hello world!')\n")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_e2e_journey_student_onboarding_and_auth(client):
    """
    E2E Journey 1: Complete Student Onboarding & Authentication Lifecycle
    - Registration -> Immediate JWT Issuance -> Login -> Dashboard Summary
    """
    email = "jordan.grad@stanford.edu"
    password = "DevPassword123!"

    # 1. Register student account
    reg_resp = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Jordan Grad",
            "role": "STUDENT",
            "headline": "CS Senior graduating Fall 2026",
        },
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["user"]["email"] == email

    # 2. Login works without mandatory email verification
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    auth_data = login_resp.json()
    token = auth_data["access_token"]
    student_headers = {"Authorization": f"Bearer {token}"}

    # 3. Access authenticated profile & dashboard
    me_resp = await client.get("/api/auth/me", headers=student_headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    dash_resp = await client.get("/api/users/dashboard-summary", headers=student_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["user"]["full_name"] == "Jordan Grad"
    assert "stats" in dash_data


@pytest.mark.asyncio
async def test_e2e_journey_project_lifecycle_moderation_and_discovery(client, db_session):
    """
    E2E Journey 2: Student Project Submission -> Admin Moderation -> Public Discovery
    - Student submits project draft
    - Uploads ZIP codebase
    - Submits for moderation
    - Admin reviews and approves project
    - Student receives approval notification
    - Public catalog displays published project with view tracking
    """
    # 1. Setup Student & Admin
    student = User(
        email="builder@campus.edu",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Alex Builder",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    admin = User(
        email="admin@careerplatform.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Morgan Moderator",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([student, admin])
    await db_session.commit()
    await db_session.refresh(student)
    await db_session.refresh(admin)

    student_token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": student.role.value}
    )
    admin_token = create_access_token(
        data={"sub": str(admin.id), "email": admin.email, "role": admin.role.value}
    )
    s_headers = {"Authorization": f"Bearer {student_token}"}
    a_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Student uploads valid ZIP archive
    zip_bytes = create_valid_zip_bytes()
    upload_resp = await client.post(
        "/api/projects/upload-zip",
        headers=s_headers,
        files={"file": ("project.zip", zip_bytes, "application/zip")},
    )
    assert upload_resp.status_code == 200
    zip_metadata = upload_resp.json()
    assert zip_metadata["files_count"] >= 2

    # 3. Student creates project with status="Submitted"
    create_proj_resp = await client.post(
        "/api/projects",
        headers=s_headers,
        json={
            "title": "Autonomous Drone Fleet Controller",
            "domain": "AI / Machine Learning",
            "short_description": "Distributed ROS2 drone telemetry and obstacle avoidance network.",
            "problem_statement": "Coordinating swarm movements in GPS-denied environments.",
            "objectives": "Build low-latency messaging and collision avoidance.",
            "tech_stack": ["Python", "ROS2", "OpenCV", "FastAPI"],
            "difficulty": "Advanced",
            "status": "Submitted",
            "cover_image_url": "https://images.example.com/drone-controller.png",
            "zip_storage_key": zip_metadata["zip_storage_key"],
        },
    )
    assert create_proj_resp.status_code == 201, create_proj_resp.text
    project_data = create_proj_resp.json()
    project_id = project_data["id"]
    slug = project_data["slug"]
    assert project_data["status"] == "Submitted"

    # 4. Admin queries moderation queue
    queue_resp = await client.get("/api/admin/projects/queue", headers=a_headers)
    assert queue_resp.status_code == 200
    pending_list = queue_resp.json()
    assert any(p["id"] == project_id for p in pending_list)

    # 5. Admin approves project
    action_resp = await client.post(
        f"/api/admin/projects/{project_id}/moderate",
        headers=a_headers,
        json={"action": "approve", "reviewer_notes": "Outstanding architecture and documentation!"},
    )
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "Published"

    # 6. Student checks in-app notifications
    notif_resp = await client.get("/api/notifications", headers=s_headers)
    assert notif_resp.status_code == 200
    notifications = notif_resp.json()
    assert any("approved" in n["title"].lower() for n in notifications)

    # 7. Unauthenticated public catalog discovery
    public_catalog = await client.get("/api/projects?domain=AI / Machine Learning")
    assert public_catalog.status_code == 200
    catalog_items = public_catalog.json()["items"]
    assert any(p["slug"] == slug for p in catalog_items)

    # 8. View details increments views_count
    detail_resp = await client.get(f"/api/projects/{slug}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["views_count"] >= 1


@pytest.mark.asyncio
async def test_e2e_journey_resume_builder_and_pdf_export(client, db_session):
    """
    E2E Journey 3: Resume Builder -> Real-time Customization -> ATS PDF Export
    """
    student = User(
        email="resume_student@university.edu",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Morgan Resume",
        role=UserRole.STUDENT,
        headline="Fullstack & Systems Developer",
        is_active=True,
        is_verified=True,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": student.role.value}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Query available ATS templates
    tpl_resp = await client.get("/api/resumes/templates", headers=headers)
    assert tpl_resp.status_code == 200
    templates = tpl_resp.json()
    # Built-in PDF layouts are implementation details; the public catalogue
    # contains only templates explicitly published by an administrator.
    assert isinstance(templates, list)

    # 2. Seed resume from profile
    seed_resp = await client.post(
        "/api/resumes/seed-from-profile",
        headers=headers,
        json={"template_id": "classic-tech"},
    )
    assert seed_resp.status_code == 201
    resume = seed_resp.json()
    resume_id = resume["id"]
    assert resume["personal_info"]["full_name"] == "Morgan Resume"

    # 3. Update resume sections with technical projects & skills
    update_payload = {
        "title": "Morgan Resume - FAANG Software Engineer",
        "template_id": "classic-tech",
        "summary": "Full stack engineer with extensive open source distributed systems experience.",
        "skills": [
            {"category": "Languages", "items": "Python, TypeScript, Go, SQL"},
            {"category": "Frameworks", "items": "FastAPI, React, Docker, Kubernetes"},
        ],
        "education": [
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science",
                "end_date": "2026",
                "gpa": "3.9 / 4.0",
            }
        ],
    }
    update_resp = await client.put(
        f"/api/resumes/{resume_id}",
        headers=headers,
        json=update_payload,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == update_payload["title"]

    # 4. Preview PDF in memory
    preview_resp = await client.post(
        "/api/resumes/preview-pdf",
        headers=headers,
        json={"resume_data": update_resp.json(), "template_id": "classic-tech"},
    )
    assert preview_resp.status_code == 200
    assert preview_resp.headers["content-type"] == "application/pdf"
    assert preview_resp.content.startswith(b"%PDF-")

    # 5. Export and download finalized PDF
    export_resp = await client.get(
        f"/api/resumes/{resume_id}/export-pdf",
        headers=headers,
    )
    assert export_resp.status_code == 200
    assert export_resp.headers["content-type"] == "application/pdf"
    assert "attachment" in export_resp.headers.get("content-disposition", "")
    assert len(export_resp.content) > 1000


@pytest.mark.asyncio
async def test_e2e_journey_job_application_and_saved_workspace(client, db_session):
    """
    E2E Journey 4: Job Discovery -> Bookmarking -> Saved Workspace -> Application Tracking
    """
    student = User(
        email="applicant@university.edu",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Taylor Applicant",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    test_job = Job(
        title="Junior Distributed Systems Engineer",
        company_name="Stripe",
        domain="Cloud & DevOps",
        job_type="Full-time",
        work_mode="Remote",
        location="Remote, Global",
        experience_level="Entry Level",
        skills_required=["Go", "Kubernetes", "Linux", "Distributed Systems"],
        description="Help build resilient financial infrastructure.",
        apply_url="https://stripe.com/jobs/123",
        is_active=True,
    )
    db_session.add_all([student, test_job])
    await db_session.commit()
    await db_session.refresh(student)
    await db_session.refresh(test_job)

    token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": student.role.value}
    )
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Bookmark the job
    bm_resp = await client.post(f"/api/jobs/{test_job.id}/bookmark", headers=headers)
    assert bm_resp.status_code == 200
    assert bm_resp.json()["bookmarked"] is True

    # 2. View Unified Saved Workspace via /api/jobs/bookmarks/my
    saved_jobs_resp = await client.get("/api/jobs/bookmarks/my", headers=headers)
    assert saved_jobs_resp.status_code == 200
    saved_jobs = saved_jobs_resp.json()
    assert len(saved_jobs) == 1
    assert saved_jobs[0]["id"] == str(test_job.id)

    # 3. Track application submission via /api/applications
    track_resp = await client.post(
        "/api/applications",
        headers=headers,
        json={
            "company_name": test_job.company_name,
            "position_title": test_job.title,
            "status": "Applied",
            "notes": "Applied via referral link",
            "job_url": test_job.apply_url,
        },
    )
    assert track_resp.status_code == 201
    assert track_resp.json()["status"] == "Applied"

    # 4. View application pipeline
    apps_resp = await client.get("/api/applications", headers=headers)
    assert apps_resp.status_code == 200
    apps_list = apps_resp.json()
    assert any(a["company_name"] == test_job.company_name for a in apps_list)


@pytest.mark.asyncio
async def test_e2e_journey_ats_analyzer_and_recommendations(client, db_session):
    """
    E2E Journey 5: ATS Match Analyzer evaluating resume against job specification
    """
    student = User(
        email="ats_candidate@university.edu",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Alex Candidate",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": student.role.value}
    )
    headers = {"Authorization": f"Bearer {token}"}

    resume_text = """
    Alex Candidate
    alex@candidate.edu | (555) 019-2834 | Seattle, WA
    
    SKILLS:
    Languages: Python, TypeScript, SQL, HTML, CSS
    Frameworks: FastAPI, React, Tailwind CSS, Docker
    
    EXPERIENCE:
    Software Engineering Intern at CloudNova
    - Built REST API endpoints with FastAPI and PostgreSQL.
    - Improved automated unit test coverage using Pytest.
    """

    job_spec = """
    Software Engineer (Backend)
    Requirements:
    - Proficient in Python, FastAPI, and relational databases (PostgreSQL).
    - Experience with Docker, Kubernetes, and Redis caching.
    - Strong problem solving and CI/CD workflow knowledge.
    """

    analysis_resp = await client.post(
        "/api/resumes/analyze-ats",
        headers=headers,
        json={"resume_text": resume_text, "job_description": job_spec},
    )
    assert analysis_resp.status_code == 200
    result = analysis_resp.json()

    assert 0 <= result["overall_score"] <= 100
    assert "breakdown" in result
    assert "skills_score" in result["breakdown"]
    assert "formatting_score" in result["breakdown"]
    assert "matched_skills" in result
    assert "missing_skills" in result
    assert len(result["bullet_recommendations"]) > 0
