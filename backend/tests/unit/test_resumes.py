import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.resume import Resume
from app.api.dependencies.auth import get_current_active_user

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
async def test_templates_catalogue_endpoint(client):
    """Public can view ATS template list with metadata."""
    resp = await client.get("/api/resumes/templates")
    assert resp.status_code == 200
    templates = resp.json()
    assert len(templates) >= 4
    template_ids = [t["id"] for t in templates]
    assert "classic-tech" in template_ids
    assert "modern-minimal" in template_ids
    assert "research-academic" in template_ids
    assert "compact-dense" in template_ids


@pytest.mark.asyncio
async def test_unauthenticated_resumes_rejected(client):
    """Unauthenticated requests are rejected with 401."""
    resp = await client.get("/api/resumes")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_resume_crud_lifecycle(client, db_session):
    """Student can create, view, update, list, and delete a resume."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    db_session.add(student_1)
    await db_session.commit()

    # 1. Create resume
    payload = {
        "title": "Full Stack Engineer Resume",
        "template_id": "classic-tech",
        "personal_info": {
            "full_name": "Alex Rivera",
            "email": "alex@example.com",
            "phone": "+1 555 123 4567",
            "location": "Seattle, WA",
            "github": "github.com/alexrivera",
            "linkedin": "linkedin.com/in/alexrivera",
        },
        "summary": "Full Stack Engineer with 2+ years experience in Python and React.",
        "education": [
            {
                "institution": "University of Washington",
                "degree": "B.S. in Computer Science",
                "start_date": "2020",
                "end_date": "2024",
                "gpa": "3.9",
            }
        ],
        "experience": [
            {
                "role": "Frontend Intern",
                "company": "Acme Corp",
                "location": "Remote",
                "start_date": "Jun 2023",
                "end_date": "Sep 2023",
                "current": False,
                "bullets": ["Optimized page rendering speed by 40%."],
            }
        ],
        "projects": [
            {
                "name": "E-Commerce App",
                "tech_stack": "React, FastAPI, PostgreSQL",
                "bullets": ["Engineered cart and checkout flow with Stripe."],
            }
        ],
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        "certifications": [{"name": "AWS Solutions Architect", "date": "2023"}],
        "is_primary": True,
    }

    create_resp = await client.post("/api/resumes", json=payload)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    resume_id = created_data["id"]
    assert created_data["title"] == "Full Stack Engineer Resume"
    assert created_data["is_primary"] is True
    assert len(created_data["skills"]) == 5

    # 2. Get single resume
    get_resp = await client.get(f"/api/resumes/{resume_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == resume_id

    # 3. List resumes
    list_resp = await client.get("/api/resumes")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    # 4. Update resume
    update_resp = await client.put(
        f"/api/resumes/{resume_id}",
        json={"title": "Senior Full Stack Resume", "template_id": "modern-minimal"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Senior Full Stack Resume"
    assert update_resp.json()["template_id"] == "modern-minimal"

    # 5. Delete resume
    del_resp = await client.delete(f"/api/resumes/{resume_id}")
    assert del_resp.status_code == 204

    # 6. Verify 404
    verify_resp = await client.get(f"/api/resumes/{resume_id}")
    assert verify_resp.status_code == 404


@pytest.mark.asyncio
async def test_seed_resume_from_profile(client, db_session):
    """Student can auto-seed a resume from their platform profile."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    db_session.add(student_1)

    profile = Profile(
        user_id=student_1.id,
        username="alex_dev",
        headline="Full Stack Architect",
        bio="Passionate engineer building scalable backends and fluid UIs.",
        university="MIT",
        degree="B.S. in Computer Science & AI",
        graduation_year=2025,
        github_url="github.com/alexrivera",
        linkedin_url="linkedin.com/in/alexrivera",
        skills=["Python", "FastAPI", "React", "Docker"],
    )
    db_session.add(profile)
    await db_session.commit()

    resp = await client.post("/api/resumes/seed-from-profile?template_id=modern-minimal")
    assert resp.status_code == 201
    seeded = resp.json()
    assert seeded["template_id"] == "modern-minimal"
    assert seeded["personal_info"]["full_name"] == "Alex Rivera"
    assert seeded["personal_info"]["email"] == "student1@university.edu"
    assert len(seeded["education"]) >= 1
    assert seeded["education"][0]["institution"] == "MIT"
    assert "Python" in seeded["skills"]


@pytest.mark.asyncio
async def test_duplicate_resume(client, db_session):
    """Student can duplicate an existing resume into a copy."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    db_session.add(student_1)
    r1 = Resume(
        user_id=student_1.id,
        title="ML Engineer Resume",
        template_id="research-academic",
        personal_info={"full_name": "Alex Rivera"},
        skills=["PyTorch", "TensorFlow"],
        is_primary=True,
    )
    db_session.add(r1)
    await db_session.commit()
    await db_session.refresh(r1)

    dup_resp = await client.post(f"/api/resumes/{r1.id}/duplicate")
    assert dup_resp.status_code == 201
    dup_data = dup_resp.json()
    assert dup_data["title"] == "ML Engineer Resume (Copy)"
    assert dup_data["is_primary"] is False
    assert dup_data["template_id"] == "research-academic"
    assert "PyTorch" in dup_data["skills"]


@pytest.mark.asyncio
async def test_cross_user_isolation(client, db_session):
    """Student 2 cannot access or mutate Student 1's resume."""
    db_session.add_all([student_1, student_2])
    r1 = Resume(
        user_id=student_1.id,
        title="Private Resume",
        template_id="classic-tech",
        is_primary=True,
    )
    db_session.add(r1)
    await db_session.commit()
    await db_session.refresh(r1)

    # Switch identity to Student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2

    # Attempt to view Student 1's resume
    get_resp = await client.get(f"/api/resumes/{r1.id}")
    assert get_resp.status_code == 404

    # Attempt to update Student 1's resume
    put_resp = await client.put(f"/api/resumes/{r1.id}", json={"title": "Hacked Title"})
    assert put_resp.status_code == 404

    # Attempt to delete Student 1's resume
    del_resp = await client.delete(f"/api/resumes/{r1.id}")
    assert del_resp.status_code == 404
