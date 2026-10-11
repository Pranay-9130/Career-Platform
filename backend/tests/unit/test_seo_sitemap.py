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


@pytest.mark.asyncio
async def test_sitemap_xml_returns_valid_xml_structure(client):
    """
    GET /sitemap.xml returns HTTP 200 with application/xml media type
    and standard sitemaps.org XML envelope.
    """
    response = await client.get("/sitemap.xml")
    assert response.status_code == 200
    assert "application/xml" in response.headers.get("content-type", "")
    content = response.text

    assert '<?xml version="1.0" encoding="UTF-8"?>' in content
    assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in content
    assert "</urlset>" in content

    # Key static pages must always be present
    assert "<loc>http://localhost:5173</loc>" in content
    assert "<loc>http://localhost:5173/projects</loc>" in content
    assert "<loc>http://localhost:5173/jobs</loc>" in content
    assert "<loc>http://localhost:5173/ats-analyzer</loc>" in content
    assert "<loc>http://localhost:5173/resumes</loc>" in content
    assert "<loc>http://localhost:5173/about</loc>" in content
    assert "<loc>http://localhost:5173/contact</loc>" in content


@pytest.mark.asyncio
async def test_sitemap_dynamically_includes_published_projects_and_active_jobs(client, db_session):
    """
    Sitemap includes published projects and active jobs, but strictly excludes
    draft / unpublished projects and inactive job listings.
    """
    author = User(
        email="author@university.edu",
        hashed_password="hash",
        full_name="Project Author",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(author)
    await db_session.flush()

    # 1. Published Project
    pub_project = Project(
        owner_id=author.id,
        title="Published AI Vision Project",
        slug="published-ai-vision-project",
        domain="AI / Machine Learning",
        short_description="An approved, public project showcase",
        status="Published",
    )
    # 2. Draft Project (should be excluded)
    draft_project = Project(
        owner_id=author.id,
        title="Secret Internal Draft",
        slug="secret-internal-draft",
        domain="Web Development",
        short_description="Work in progress draft",
        status="Draft",
    )
    # 3. Active Job
    active_job = Job(
        title="Senior Cloud Architect",
        company_name="Google Cloud",
        domain="Cloud",
        job_type="Full-time",
        work_mode="Remote",
        location="Remote, US",
        experience_level="Senior",
        description="Build scalable distributed cloud infrastructure.",
        apply_url="https://cloud.google.com/careers",
        is_active=True,
    )
    # 4. Inactive Job (should be excluded)
    inactive_job = Job(
        title="Archived Summer Intern",
        company_name="Legacy Corp",
        domain="Software",
        job_type="Internship",
        work_mode="On-site",
        location="Boston, MA",
        experience_level="Entry Level",
        description="Position closed.",
        apply_url="https://legacy.corp/jobs/intern",
        is_active=False,
    )

    db_session.add_all([pub_project, draft_project, active_job, inactive_job])
    await db_session.commit()
    await db_session.refresh(active_job)
    await db_session.refresh(inactive_job)

    response = await client.get("/sitemap.xml")
    assert response.status_code == 200
    xml_text = response.text

    # Published project and active job must be in sitemap
    assert f"<loc>http://localhost:5173/projects/{pub_project.slug}</loc>" in xml_text
    assert f"<loc>http://localhost:5173/jobs/{active_job.id}</loc>" in xml_text

    # Draft project and inactive job MUST NOT be in sitemap
    assert "secret-internal-draft" not in xml_text
    assert str(inactive_job.id) not in xml_text


@pytest.mark.asyncio
async def test_robots_txt_endpoint(client):
    """
    GET /robots.txt returns search engine indexing guidance and canonical sitemap.
    """
    response = await client.get("/robots.txt")
    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")
    content = response.text

    assert "User-agent: *" in content
    assert "Allow: /" in content
    assert "Disallow: /admin/" in content
    assert "Disallow: /workspace" in content
    assert "Disallow: /dashboard" in content
    assert "Sitemap: http://localhost:5173/sitemap.xml" in content
