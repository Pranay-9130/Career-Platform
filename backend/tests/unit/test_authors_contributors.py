import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.project import Project
from app.core.security import get_password_hash

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


async def create_user_and_profile(
    db: AsyncSession,
    email: str,
    full_name: str,
    username: str,
    headline: str = "Student Engineer",
    github_url: str = "https://github.com/leadcoder",
):
    user = User(
        email=email,
        hashed_password=get_password_hash("Password123!"),
        full_name=full_name,
        role=UserRole.STUDENT,
        is_verified=True,
        headline=headline,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    profile = Profile(
        user_id=user.id,
        username=username,
        headline=headline,
        bio="Passionate engineer building scalable applications.",
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
        university="State University",
        degree="B.S. in Software Engineering",
        graduation_year=2026,
        skills=["Python", "FastAPI", "React", "PostgreSQL"],
        github_url=github_url,
        linkedin_url=f"https://linkedin.com/in/{username}",
        portfolio_url=f"https://{username}.dev",
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return user, profile


@pytest.mark.asyncio
async def test_public_profile_returns_authored_projects(client, db_session):
    """Public profile showcases published projects authored by the student with metrics."""
    author, author_prof = await create_user_and_profile(
        db_session, "author@example.com", "Alex Morgan", "alexmorgan"
    )

    project = Project(
        owner_id=author.id,
        title="Distributed Task Queue",
        slug="distributed-task-queue",
        short_description="High-throughput distributed task scheduler with Redis backplane.",
        problem_statement="Background jobs fail without retry pipelines.",
        domain="Cloud & DevOps",
        difficulty="Advanced",
        tech_stack=["Python", "Redis", "Celery", "FastAPI"],
        status="Published",
        stars_count=15,
        views_count=120,
    )
    db_session.add(project)
    await db_session.commit()

    res = await client.get("/api/users/alexmorgan")
    assert res.status_code == 200
    data = res.json()

    assert data["username"] == "alexmorgan"
    assert data["full_name"] == "Alex Morgan"
    assert data["projects_count"] == 1
    assert data["total_stars_count"] == 15
    assert data["total_views_count"] == 120
    assert len(data["projects"]) == 1
    p = data["projects"][0]
    assert p["slug"] == "distributed-task-queue"
    assert p["title"] == "Distributed Task Queue"
    assert p["role"] == "Lead Author"
    assert p["stars_count"] == 15
    assert p["views_count"] == 120


@pytest.mark.asyncio
async def test_public_profile_returns_coauthored_projects(client, db_session):
    """Public profile accurately attributes co-authored projects where student is in contributors."""
    lead_author, _ = await create_user_and_profile(
        db_session, "lead@example.com", "Lead Author", "leadauthor"
    )
    co_author, _ = await create_user_and_profile(
        db_session, "coauthor@example.com", "Jordan Smith", "jordansmith",
        github_url="https://github.com/jordansmith"
    )

    project = Project(
        owner_id=lead_author.id,
        title="Autonomous Drone Vision",
        slug="autonomous-drone-vision",
        short_description="Real-time object segmentation on embedded edge devices.",
        domain="AI / Machine Learning",
        difficulty="Advanced",
        tech_stack=["PyTorch", "Python", "OpenCV"],
        status="Published",
        stars_count=42,
        views_count=500,
        contributors=[
            {
                "name": "Jordan Smith",
                "role": "Computer Vision Lead",
                "profile_username": "jordansmith",
                "github_username": "jordansmith",
            }
        ],
    )
    db_session.add(project)
    await db_session.commit()

    # Query co-author's profile
    res = await client.get("/api/users/jordansmith")
    assert res.status_code == 200
    data = res.json()

    assert data["username"] == "jordansmith"
    assert data["projects_count"] == 1
    assert data["total_stars_count"] == 42
    assert len(data["projects"]) == 1
    assert data["projects"][0]["slug"] == "autonomous-drone-vision"
    assert data["projects"][0]["role"] == "Computer Vision Lead"


@pytest.mark.asyncio
async def test_public_profile_excludes_draft_projects(client, db_session):
    """Work-in-progress draft projects are strictly excluded from public showcased profiles."""
    user, _ = await create_user_and_profile(
        db_session, "draftguy@example.com", "Draft Guy", "draftguy"
    )

    draft_proj = Project(
        owner_id=user.id,
        title="Unfinished Quantum Simulator",
        slug="unfinished-quantum-simulator",
        short_description="Draft notes and preliminary sketches for quantum circuits.",
        domain="AI / Machine Learning",
        status="Draft",
    )
    db_session.add(draft_proj)
    await db_session.commit()

    res = await client.get("/api/users/draftguy")
    assert res.status_code == 200
    data = res.json()
    assert data["projects_count"] == 0
    assert len(data["projects"]) == 0


@pytest.mark.asyncio
async def test_public_profile_not_found(client, db_session):
    """Non-existent username returns 404."""
    res = await client.get("/api/users/nonexistent_student_999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_project_detail_enriches_contributors(client, db_session):
    """GET /api/projects/{slug} enriches contributors with profile username and avatar."""
    owner, _ = await create_user_and_profile(
        db_session, "owner@example.com", "Project Lead", "projectlead"
    )
    contributor_user, cont_prof = await create_user_and_profile(
        db_session, "contributor@example.com", "Taylor Swift", "taylorswift",
        github_url="https://github.com/tswift"
    )

    project = Project(
        owner_id=owner.id,
        title="Music Analytics Dashboard",
        slug="music-analytics-dashboard",
        short_description="Stream metrics visualizer with real-time charts.",
        domain="Web Development",
        status="Published",
        contributors=[
            {
                "name": "Taylor Swift",
                "role": "Data Analyst",
                "profile_username": "taylorswift",
            }
        ],
    )
    db_session.add(project)
    await db_session.commit()

    res = await client.get("/api/projects/music-analytics-dashboard")
    assert res.status_code == 200
    data = res.json()

    assert len(data["contributors"]) == 1
    c = data["contributors"][0]
    assert c["name"] == "Taylor Swift"
    assert c["role"] == "Data Analyst"
    assert c["profile_username"] == "taylorswift"
    assert c["avatar_url"] == cont_prof.avatar_url


@pytest.mark.asyncio
async def test_project_detail_includes_author_social_links(client, db_session):
    """GET /api/projects/{slug} includes author social links and university bio."""
    owner, prof = await create_user_and_profile(
        db_session, "profauthor@example.com", "Dr. Tech", "drtech"
    )

    project = Project(
        owner_id=owner.id,
        title="Microservice Observability Suite",
        slug="microservice-observability-suite",
        short_description="Distributed tracing agent with OpenTelemetry export.",
        domain="Cloud & DevOps",
        status="Published",
    )
    db_session.add(project)
    await db_session.commit()

    res = await client.get("/api/projects/microservice-observability-suite")
    assert res.status_code == 200
    data = res.json()

    assert data["author_name"] == "Dr. Tech"
    assert data["author_username"] == "drtech"
    assert data["author_github"] == prof.github_url
    assert data["author_linkedin"] == prof.linkedin_url
    assert data["author_portfolio"] == prof.portfolio_url
    assert data["author_university"] == "State University"
