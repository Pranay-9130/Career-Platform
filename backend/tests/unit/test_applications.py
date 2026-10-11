import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.job_application import JobApplication
from app.api.dependencies.auth import get_current_active_user

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

student_1 = User(
    id=uuid.UUID("11111111-2222-3333-4444-555555555555"),
    email="student1@university.edu",
    hashed_password="hash",
    full_name="Student One",
    role=UserRole.STUDENT,
    is_active=True,
    is_verified=True,
)

student_2 = User(
    id=uuid.UUID("22222222-3333-4444-5555-666666666666"),
    email="student2@university.edu",
    hashed_password="hash",
    full_name="Student Two",
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
async def test_unauthenticated_applications_rejected(client):
    """Unauthenticated requests to applications tracker are rejected with HTTP 401."""
    resp = await client.get("/api/applications")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_and_list_applications(client, db_session):
    """Student can track applications and compute pipeline statistics."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    db_session.add(student_1)
    await db_session.commit()

    # 1. Create a custom external application
    create_payload = {
        "company_name": "Google",
        "position_title": "Software Engineering Intern",
        "job_location": "Mountain View, CA",
        "work_mode": "Hybrid",
        "salary_or_stipend": "$55/hr",
        "job_url": "https://careers.google.com",
        "status": "Applied",
        "notes": "Referred by campus recruiter",
    }
    resp = await client.post("/api/applications", json=create_payload)
    assert resp.status_code == 201
    app_data = resp.json()
    assert app_data["company_name"] == "Google"
    assert app_data["status"] == "Applied"
    app_id = app_data["id"]

    # 2. Add second application in Interviewing stage
    await client.post(
        "/api/applications",
        json={
            "company_name": "Microsoft",
            "position_title": "Explorer Intern",
            "status": "Interviewing",
        },
    )

    # 3. Check stats
    stats_resp = await client.get("/api/applications/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total"] == 2
    assert stats["applied"] == 1
    assert stats["interviewing"] == 1

    # 4. Filter by status
    filter_resp = await client.get("/api/applications?status_filter=Interviewing")
    assert filter_resp.status_code == 200
    items = filter_resp.json()
    assert len(items) == 1
    assert items[0]["company_name"] == "Microsoft"

    # 5. Update first application stage to Offer
    update_resp = await client.put(
        f"/api/applications/{app_id}",
        json={"status": "Offer", "salary_or_stipend": "$60/hr", "notes": "Offer accepted!"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "Offer"
    assert update_resp.json()["notes"] == "Offer accepted!"

    # 6. Delete application
    del_resp = await client.delete(f"/api/applications/{app_id}")
    assert del_resp.status_code == 204

    # Verify deleted
    get_after = await client.get(f"/api/applications/{app_id}")
    assert get_after.status_code == 404


@pytest.mark.asyncio
async def test_create_application_linked_to_job(client, db_session):
    """Tracking an application referencing a platform Job inherits defaults."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    db_session.add(student_1)
    job = Job(
        title="Backend Engineer",
        company_name="Netflix",
        location="Los Gatos, CA",
        work_mode="Remote",
        stipend_or_salary="$140,000/yr",
        apply_url="https://jobs.netflix.com",
    )
    db_session.add(job)
    await db_session.commit()

    resp = await client.post(
        "/api/applications",
        json={
            "job_id": str(job.id),
            "company_name": "Netflix",
            "position_title": "Backend Engineer",
            "status": "Applied",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["job_id"] == str(job.id)
    assert data["company_name"] == "Netflix"
    assert data["job_location"] == "Los Gatos, CA"
    assert data["salary_or_stipend"] == "$140,000/yr"


@pytest.mark.asyncio
async def test_cross_user_isolation(client, db_session):
    """Students cannot access or mutate applications owned by other students."""
    db_session.add_all([student_1, student_2])

    app_student1 = JobApplication(
        user_id=student_1.id,
        company_name="Apple",
        position_title="iOS Developer Intern",
        status="Applied",
    )
    db_session.add(app_student1)
    await db_session.commit()

    # Authenticate as student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2

    # Attempt to view student 1's application
    resp_get = await client.get(f"/api/applications/{app_student1.id}")
    assert resp_get.status_code == 403

    # Attempt to modify student 1's application
    resp_put = await client.put(
        f"/api/applications/{app_student1.id}",
        json={"status": "Rejected"},
    )
    assert resp_put.status_code == 403

    # Attempt to delete student 1's application
    resp_del = await client.delete(f"/api/applications/{app_student1.id}")
    assert resp_del.status_code == 403
