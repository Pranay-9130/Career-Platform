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
async def test_list_jobs_empty(client):
    """Empty database returns 0 jobs with empty facet lists."""
    resp = await client.get("/api/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["facets"]["domains"] == []


@pytest.mark.asyncio
async def test_homepage_job_request_uses_supported_sort_without_facets(client):
    """The homepage preview avoids unused facets and accepts its production query."""
    resp = await client.get("/api/jobs?limit=3&sort=newest&include_facets=false")

    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["facets"] == {
        "domains": [],
        "job_types": [],
        "work_modes": [],
        "experience_levels": [],
        "candidate_types": [],
    }


@pytest.mark.asyncio
async def test_create_job_authorization(client):
    """Students cannot create jobs (403), but admins can create new jobs (201)."""
    # 1. Student attempt
    app.dependency_overrides[get_current_active_user] = lambda: student_user
    payload = {
        "title": "Software Engineer Intern",
        "company_name": "TechCo",
        "domain": "Frontend",
        "job_type": "Internship",
        "work_mode": "Remote",
        "skills_required": ["React", "JavaScript"],
        "apply_url": "https://techco.com/careers",
    }
    resp = await client.post("/api/jobs", json=payload)
    assert resp.status_code == 403

    # 2. Admin attempt
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    resp_admin = await client.post("/api/jobs", json=payload)
    assert resp_admin.status_code == 201
    job_data = resp_admin.json()
    assert job_data["title"] == "Software Engineer Intern"
    assert job_data["company_name"] == "TechCo"
    assert "React" in job_data["skills_required"]


@pytest.mark.asyncio
async def test_jobs_filtering_and_search(client, db_session):
    """Test filtering jobs by domain, work mode, type, search term, and facet calculations."""
    j1 = Job(
        title="Full Stack Engineer",
        company_name="Alpha Labs",
        domain="Full-Stack Development",
        job_type="Full-time",
        work_mode="Remote",
        skills_required=["FastAPI", "React", "PostgreSQL"],
        description="Build end to end platforms",
        apply_url="https://alpha.io",
        is_active=True,
        is_featured=True,
    )
    j2 = Job(
        title="Machine Learning Intern",
        company_name="Beta AI",
        domain="AI / Machine Learning",
        job_type="Internship",
        work_mode="Onsite",
        skills_required=["PyTorch", "Python"],
        description="Train generative models",
        apply_url="https://beta.ai",
        is_active=True,
        is_featured=False,
    )
    j3 = Job(
        title="DevOps Inactive",
        company_name="Gamma Cloud",
        domain="Cloud & DevOps",
        job_type="Contract",
        work_mode="Remote",
        apply_url="https://gamma.io",
        is_active=False,  # Inactive job should not be listed
    )
    db_session.add_all([j1, j2, j3])
    await db_session.commit()

    # 1. Default list: only 2 active jobs
    resp = await client.get("/api/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Facets check
    domain_facets = [d["name"] for d in data["facets"]["domains"]]
    assert "Full-Stack Development" in domain_facets
    assert "AI / Machine Learning" in domain_facets
    assert "Cloud & DevOps" not in domain_facets  # inactive excluded

    # 2. Filter by work_mode=Remote
    resp_remote = await client.get("/api/jobs?work_mode=Remote")
    assert resp_remote.status_code == 200
    assert resp_remote.json()["total"] == 1
    assert resp_remote.json()["items"][0]["company_name"] == "Alpha Labs"

    # 3. Filter by job_type=Internship
    resp_intern = await client.get("/api/jobs?job_type=Internship")
    assert resp_intern.status_code == 200
    assert resp_intern.json()["total"] == 1
    assert resp_intern.json()["items"][0]["title"] == "Machine Learning Intern"

    # 4. Keyword search across skills
    resp_search = await client.get("/api/jobs?search=PyTorch")
    assert resp_search.status_code == 200
    assert resp_search.json()["total"] == 1
    assert resp_search.json()["items"][0]["company_name"] == "Beta AI"


@pytest.mark.asyncio
async def test_get_job_detail_and_update(client, db_session):
    """Retrieve single job and test admin update and delete."""
    job = Job(
        title="Platform Engineer",
        company_name="CloudCo",
        domain="Cloud & DevOps",
        job_type="Full-time",
        work_mode="Remote",
        apply_url="https://cloudco.com",
        is_active=True,
    )
    db_session.add(job)
    await db_session.commit()

    # 1. Unauthenticated request to Job Details must return 401 Unauthorized
    resp_unauth = await client.get(f"/api/jobs/{job.id}")
    assert resp_unauth.status_code == 401

    # 2. Authenticated Student request returns 200 with full details
    app.dependency_overrides[get_current_active_user] = lambda: student_user
    resp_get = await client.get(f"/api/jobs/{job.id}")
    assert resp_get.status_code == 200
    assert resp_get.json()["title"] == "Platform Engineer"

    # 3. Update Job (Admin)
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    resp_update = await client.put(
        f"/api/jobs/{job.id}",
        json={"title": "Senior Platform Engineer", "stipend_or_salary": "$150,000/yr"},
    )
    assert resp_update.status_code == 200
    assert resp_update.json()["title"] == "Senior Platform Engineer"
    assert resp_update.json()["stipend_or_salary"] == "$150,000/yr"

    # 4. Delete Job (Admin)
    resp_del = await client.delete(f"/api/jobs/{job.id}")
    assert resp_del.status_code == 204

    # Verify deleted (authenticated)
    resp_after = await client.get(f"/api/jobs/{job.id}")
    assert resp_after.status_code == 404


@pytest.mark.asyncio
async def test_job_application_start_date_and_deadline(client):
    """Test creating and updating job with application_start_date and deadline validation."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    # 1. Valid application start and deadline
    payload = {
        "title": "Cloud Architect Intern",
        "company_name": "CloudNine",
        "domain": "Cloud & DevOps",
        "job_type": "Internship",
        "work_mode": "Remote",
        "skills_required": ["AWS", "Terraform"],
        "apply_url": "https://cloudnine.io/careers",
        "application_start_date": "2026-11-01T00:00:00Z",
        "deadline": "2026-11-30T23:59:59Z",
    }
    resp = await client.post("/api/jobs", json=payload)
    assert resp.status_code == 201
    created_data = resp.json()
    assert created_data["application_start_date"] is not None
    assert "2026-11-01" in created_data["application_start_date"]
    assert "2026-11-30" in created_data["deadline"]
    job_id = created_data["id"]

    # 2. Update application_start_date
    update_payload = {
        "application_start_date": "2026-11-05T00:00:00Z",
    }
    resp_update = await client.put(f"/api/jobs/{job_id}", json=update_payload)
    assert resp_update.status_code == 200
    assert "2026-11-05" in resp_update.json()["application_start_date"]

    # 3. Reject invalid range: deadline before start date
    invalid_payload = {
        "application_start_date": "2026-12-01T00:00:00Z",
        "deadline": "2026-11-01T00:00:00Z",
    }
    resp_invalid = await client.put(f"/api/jobs/{job_id}", json=invalid_payload)
    assert resp_invalid.status_code == 422


@pytest.mark.asyncio
async def test_job_eligibility_fields_and_filtering(client, db_session):
    """Test job creation, update, and filtering with eligibility fields."""
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    # 1. Create Job with specific eligibility fields
    payload_1 = {
        "title": "Graduate Software Engineer",
        "company_name": "TechCorp",
        "domain": "Software Development",
        "job_type": "Full-time",
        "work_mode": "Hybrid",
        "apply_url": "https://techcorp.com/apply",
        "eligible_batches": ["2025", "2026"],
        "candidate_type": "Freshers Only",
        "eligible_qualifications": ["B.Tech", "MCA"],
    }
    resp1 = await client.post("/api/jobs", json=payload_1)
    assert resp1.status_code == 201
    job1 = resp1.json()
    assert job1["eligible_batches"] == ["2025", "2026"]
    assert job1["candidate_type"] == "Freshers Only"
    assert job1["eligible_qualifications"] == ["B.Tech", "MCA"]

    # 2. Create Job with "All Batches"
    payload_2 = {
        "title": "Senior Backend Architect",
        "company_name": "TechCorp",
        "domain": "Software Development",
        "job_type": "Full-time",
        "work_mode": "Remote",
        "apply_url": "https://techcorp.com/apply-senior",
        "eligible_batches": ["All Batches"],
        "candidate_type": "Experienced Only",
        "eligible_qualifications": ["B.Tech", "M.Tech"],
    }
    resp2 = await client.post("/api/jobs", json=payload_2)
    assert resp2.status_code == 201
    job2 = resp2.json()
    assert job2["eligible_batches"] == ["All Batches"]
    assert job2["candidate_type"] == "Experienced Only"

    # 3. Create Job with "Both Freshers and Experienced" and unspecified batches
    payload_3 = {
        "title": "UI Designer",
        "company_name": "DesignStudio",
        "domain": "Design",
        "job_type": "Contract",
        "work_mode": "Remote",
        "apply_url": "https://designstudio.com/apply",
        "eligible_batches": [],
        "candidate_type": "Both Freshers and Experienced",
        "eligible_qualifications": ["Diploma", "B.Sc", "Other"],
    }
    resp3 = await client.post("/api/jobs", json=payload_3)
    assert resp3.status_code == 201
    job3 = resp3.json()
    assert job3["eligible_batches"] == []
    assert job3["candidate_type"] == "Both Freshers and Experienced"

    # 4. Create Job with completely unspecified eligibility (older jobs style)
    payload_4 = {
        "title": "Data Analyst",
        "company_name": "AnalyticsCo",
        "domain": "Data",
        "job_type": "Full-time",
        "work_mode": "On-site",
        "apply_url": "https://analyticsco.com/apply",
    }
    resp4 = await client.post("/api/jobs", json=payload_4)
    assert resp4.status_code == 201
    job4 = resp4.json()
    assert job4["eligible_batches"] == []
    assert job4["candidate_type"] is None
    assert job4["eligible_qualifications"] == []

    # 5. Update eligibility fields on job1
    update_payload = {
        "eligible_batches": ["2024", "2025"],
        "candidate_type": "Both Freshers and Experienced",
        "eligible_qualifications": ["B.Tech", "B.E.", "MCA"],
    }
    resp_up = await client.put(f"/api/jobs/{job1['id']}", json=update_payload)
    assert resp_up.status_code == 200
    assert resp_up.json()["eligible_batches"] == ["2024", "2025"]
    assert resp_up.json()["candidate_type"] == "Both Freshers and Experienced"
    assert resp_up.json()["eligible_qualifications"] == ["B.Tech", "B.E.", "MCA"]

    # 6. Reject invalid candidate type
    resp_invalid_type = await client.put(f"/api/jobs/{job1['id']}", json={"candidate_type": "Invalid Type"})
    assert resp_invalid_type.status_code == 422

    # 7. Test Filtering:
    # Filter by graduation_batch: "2024" should match:
    # - job1 (has 2024)
    # - job2 (has "All Batches")
    # - job3 (unspecified batches)
    # - job4 (unspecified batches)
    resp_f_batch = await client.get("/api/jobs?graduation_batch=2024")
    assert resp_f_batch.status_code == 200
    batch_job_ids = {j["id"] for j in resp_f_batch.json()["items"]}
    assert job1["id"] in batch_job_ids
    assert job2["id"] in batch_job_ids
    assert job3["id"] in batch_job_ids
    assert job4["id"] in batch_job_ids

    # Filter by candidate_type: "Freshers Only" should match:
    # - jobs accepting Freshers Only OR Both Freshers and Experienced OR unspecified
    resp_f_cand = await client.get("/api/jobs?candidate_type=Freshers%20Only")
    assert resp_f_cand.status_code == 200
    cand_job_ids = {j["id"] for j in resp_f_cand.json()["items"]}
    assert job1["id"] in cand_job_ids  # updated to "Both Freshers and Experienced"
    assert job3["id"] in cand_job_ids  # "Both Freshers and Experienced"
    assert job4["id"] in cand_job_ids  # unspecified
    assert job2["id"] not in cand_job_ids  # "Experienced Only" should NOT match

    # Filter by qualification: "M.Tech" should match:
    # - job2 (has M.Tech)
    # - job4 (unspecified qualifications)
    resp_f_qual = await client.get("/api/jobs?qualification=M.Tech")
    assert resp_f_qual.status_code == 200
    qual_job_ids = {j["id"] for j in resp_f_qual.json()["items"]}
    assert job2["id"] in qual_job_ids
    assert job4["id"] in qual_job_ids
    assert job3["id"] not in qual_job_ids
