import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
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


async def seed_test_data(session: AsyncSession):
    student = User(
        email="developer@school.edu",
        hashed_password=get_password_hash("DevPassword123!"),
        full_name="Jordan Developer",
        role=UserRole.STUDENT,
        headline="Full Stack Junior",
        is_active=True,
        is_verified=True,
    )
    session.add(student)
    await session.commit()
    await session.refresh(student)

    p1 = Project(
        owner_id=student.id,
        title="Web Portfolio Builder",
        slug="web-portfolio-builder",
        domain="Web Development",
        short_description="Clean portfolio builder for tech graduates",
        problem_statement="Building portfolios is hard without guidance",
        features=["Clean UI", "Export to PDF"],
        tech_stack=["React", "Tailwind CSS", "FastAPI"],
        difficulty="Beginner",
        estimated_duration="1-2 weeks",
        status="Published",
        views_count=10,
        stars_count=5,
        bookmarks_count=2,
    )
    p2 = Project(
        owner_id=student.id,
        title="AI Vision Classifier",
        slug="ai-vision-classifier",
        domain="AI / Machine Learning",
        short_description="Computer vision model classifying industrial defects",
        problem_statement="Detecting defects on assembly lines using deep learning",
        features=["Inference API", "Heatmap visualizer"],
        tech_stack=["Python", "PyTorch", "OpenCV"],
        difficulty="Advanced",
        estimated_duration="3-4 weeks",
        status="Published",
        views_count=50,
        stars_count=25,
        bookmarks_count=10,
    )
    p3 = Project(
        owner_id=student.id,
        title="Draft Unpublished Project",
        slug="draft-project",
        domain="Cloud & DevOps",
        short_description="Work in progress infrastructure project",
        problem_statement="Unpublished draft",
        tech_stack=["Docker", "Kubernetes"],
        difficulty="Intermediate",
        estimated_duration="2-3 weeks",
        status="Draft",
    )
    session.add_all([p1, p2, p3])
    await session.commit()
    return student, p1, p2, p3


@pytest.mark.asyncio
async def test_list_projects_empty_catalog(client):
    """Empty database returns 0 items and empty facets without errors."""
    response = await client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["facets"]["domains"] == []


@pytest.mark.asyncio
async def test_list_projects_filtering_and_facets(client, db_session):
    """Verifies domain, difficulty, tech stack, and search filters only match published projects."""
    await seed_test_data(db_session)

    # 1. Default listing: only 2 published items (draft excluded)
    resp = await client.get("/api/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Facets check
    facets = data["facets"]
    domains = [f["name"] for f in facets["domains"]]
    assert "Web Development" in domains
    assert "AI / Machine Learning" in domains
    assert "Cloud & DevOps" not in domains  # draft domain excluded

    # 2. Filter by domain
    resp_web = await client.get("/api/projects?domain=Web Development")
    assert resp_web.status_code == 200
    assert resp_web.json()["total"] == 1
    assert resp_web.json()["items"][0]["slug"] == "web-portfolio-builder"

    # 3. Filter by difficulty
    resp_adv = await client.get("/api/projects?difficulty=Advanced")
    assert resp_adv.status_code == 200
    assert resp_adv.json()["total"] == 1
    assert resp_adv.json()["items"][0]["slug"] == "ai-vision-classifier"

    # 4. Filter by tech stack
    resp_tech = await client.get("/api/projects?tech=PyTorch")
    assert resp_tech.status_code == 200
    assert resp_tech.json()["total"] == 1
    assert resp_tech.json()["items"][0]["slug"] == "ai-vision-classifier"

    # 5. Search keyword
    resp_search = await client.get("/api/projects?search=portfolio")
    assert resp_search.status_code == 200
    assert resp_search.json()["total"] == 1
    assert resp_search.json()["items"][0]["slug"] == "web-portfolio-builder"

    # 6. Sorting check
    resp_sort = await client.get("/api/projects?sort=popular")
    assert resp_sort.status_code == 200
    # ai-vision-classifier has 50 views, web has 10
    assert resp_sort.json()["items"][0]["slug"] == "ai-vision-classifier"


@pytest.mark.asyncio
async def test_get_project_facets_endpoint(client, db_session):
    """GET /api/projects/facets returns aggregated metadata."""
    await seed_test_data(db_session)
    response = await client.get("/api/projects/facets")
    assert response.status_code == 200
    data = response.json()
    assert len(data["domains"]) == 2
    assert "React" in data["technologies"]
    assert "PyTorch" in data["technologies"]


@pytest.mark.asyncio
async def test_get_project_by_slug_increments_views(client, db_session):
    """Fetching project detail returns full schema and increments view count."""
    _, p1, _, _ = await seed_test_data(db_session)
    initial_views = p1.views_count

    response = await client.get(f"/api/projects/{p1.slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == p1.slug
    assert data["views_count"] == initial_views + 1
    assert data["problem_statement"] == p1.problem_statement


@pytest.mark.asyncio
async def test_get_project_by_slug_not_found_or_draft(client, db_session):
    """Unknown slug returns 404, and anonymous access to draft returns 404."""
    await seed_test_data(db_session)

    resp_404 = await client.get("/api/projects/non-existent-slug-xyz")
    assert resp_404.status_code == 404

    resp_draft = await client.get("/api/projects/draft-project")
    assert resp_draft.status_code == 404


@pytest.mark.asyncio
async def test_bookmark_unauthenticated_rejected(client, db_session):
    """POST /api/projects/{slug}/bookmark without token returns 401."""
    _, p1, _, _ = await seed_test_data(db_session)
    response = await client.post(f"/api/projects/{p1.slug}/bookmark")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_bookmark_lifecycle_and_my_bookmarks(client, db_session):
    """Authenticated student can bookmark, retrieve bookmarked list, and unbookmark."""
    student, p1, _, _ = await seed_test_data(db_session)

    # Login to get bearer token
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    initial_bookmarks = p1.bookmarks_count

    # 1. Bookmark p1
    bm_resp = await client.post(f"/api/projects/{p1.slug}/bookmark", headers=headers)
    assert bm_resp.status_code == 200
    bm_data = bm_resp.json()
    assert bm_data["bookmarked"] is True
    assert bm_data["bookmarks_count"] == initial_bookmarks + 1

    # 2. Check in my bookmarks list
    my_bm_resp = await client.get("/api/projects/bookmarks/my", headers=headers)
    assert my_bm_resp.status_code == 200
    my_bms = my_bm_resp.json()
    assert len(my_bms) == 1
    assert my_bms[0]["slug"] == p1.slug
    assert my_bms[0]["is_bookmarked"] is True

    # 3. Discovery listing reflects is_bookmarked=True
    disc_resp = await client.get("/api/projects", headers=headers)
    assert disc_resp.status_code == 200
    items = disc_resp.json()["items"]
    p1_item = next(item for item in items if item["slug"] == p1.slug)
    assert p1_item["is_bookmarked"] is True

    # 4. Toggle bookmark again -> unbookmark
    unbm_resp = await client.post(f"/api/projects/{p1.slug}/bookmark", headers=headers)
    assert unbm_resp.status_code == 200
    assert unbm_resp.json()["bookmarked"] is False
    assert unbm_resp.json()["bookmarks_count"] == initial_bookmarks

    # 5. My bookmarks is now empty
    my_bm_resp2 = await client.get("/api/projects/bookmarks/my", headers=headers)
    assert my_bm_resp2.status_code == 200
    assert len(my_bm_resp2.json()) == 0


@pytest.mark.asyncio
async def test_project_star_lifecycle_and_detail_state(client, db_session):
    """A user can star once, see the state on detail, and remove the star."""
    student, p1, _, _ = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    initial_stars = p1.stars_count

    anonymous = await client.post(f"/api/projects/{p1.slug}/star")
    assert anonymous.status_code == 401

    starred = await client.post(f"/api/projects/{p1.slug}/star", headers=headers)
    assert starred.status_code == 200
    assert starred.json()["starred"] is True
    assert starred.json()["stars_count"] == initial_stars + 1

    detail = await client.get(f"/api/projects/{p1.slug}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["is_starred"] is True

    unstarred = await client.post(f"/api/projects/{p1.slug}/star", headers=headers)
    assert unstarred.status_code == 200
    assert unstarred.json()["starred"] is False
    assert unstarred.json()["stars_count"] == initial_stars


@pytest.mark.asyncio
async def test_project_comment_create_list_and_delete(client, db_session):
    """Comments are public to read, require login to create, and are removable by their author."""
    student, p1, _, _ = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    anonymous_create = await client.post(
        f"/api/projects/{p1.slug}/comments",
        json={"body": "Excellent work!"},
    )
    assert anonymous_create.status_code == 401

    created = await client.post(
        f"/api/projects/{p1.slug}/comments",
        headers=headers,
        json={"body": "  Excellent architecture and documentation!  "},
    )
    assert created.status_code == 201
    comment = created.json()
    assert comment["body"] == "Excellent architecture and documentation!"
    assert comment["author_name"] == student.full_name
    assert comment["can_delete"] is True

    public_list = await client.get(f"/api/projects/{p1.slug}/comments")
    assert public_list.status_code == 200
    assert public_list.json()["total"] == 1
    assert public_list.json()["items"][0]["can_delete"] is False

    deleted = await client.delete(
        f"/api/projects/{p1.slug}/comments/{comment['id']}",
        headers=headers,
    )
    assert deleted.status_code == 200
    assert (await client.get(f"/api/projects/{p1.slug}/comments")).json()["total"] == 0


@pytest.mark.asyncio
async def test_comment_authorization_and_validation(client, db_session):
    """Comment length is validated and another student cannot delete it."""
    student, p1, _, _ = await seed_test_data(db_session)
    other = User(
        email="other@school.edu",
        hashed_password=get_password_hash("OtherPassword123!"),
        full_name="Other Student",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=False,
    )
    db_session.add(other)
    await db_session.commit()

    owner_login = await client.post(
        "/api/auth/login", json={"email": student.email, "password": "DevPassword123!"}
    )
    other_login = await client.post(
        "/api/auth/login", json={"email": other.email, "password": "OtherPassword123!"}
    )
    owner_headers = {"Authorization": f"Bearer {owner_login.json()['access_token']}"}
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    invalid = await client.post(
        f"/api/projects/{p1.slug}/comments", headers=owner_headers, json={"body": "x"}
    )
    assert invalid.status_code == 422

    created = await client.post(
        f"/api/projects/{p1.slug}/comments",
        headers=owner_headers,
        json={"body": "Really thoughtful implementation."},
    )
    forbidden = await client.delete(
        f"/api/projects/{p1.slug}/comments/{created.json()['id']}",
        headers=other_headers,
    )
    assert forbidden.status_code == 403

@pytest.mark.asyncio
async def test_project_detail_rich_specs_and_screenshots(client, db_session):
    """GET /api/projects/{slug} returns rich specs, screenshots array, and author info."""
    student, p1, _, _ = await seed_test_data(db_session)
    p1.screenshots = [
        {"image_url": "https://img.test/shot1.png", "caption": "Overview Dashboard", "order_index": 0},
        {"image_url": "https://img.test/shot2.png", "caption": "Editor View", "order_index": 1},
    ]
    p1.objectives = "Complete the portfolio builder and deploy"
    p1.prerequisites = "React, HTML, CSS"
    p1.expected_outcome = "Deployable web app"
    await db_session.commit()

    resp = await client.get(f"/api/projects/{p1.slug}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == p1.slug
    assert len(data["screenshots"]) == 2
    assert data["screenshots"][0]["caption"] == "Overview Dashboard"
    assert data["objectives"] == "Complete the portfolio builder and deploy"
    assert data["prerequisites"] == "React, HTML, CSS"
    assert data["expected_outcome"] == "Deployable web app"
    assert data["author_name"] == student.full_name


@pytest.mark.asyncio
async def test_get_related_projects_endpoint(client, db_session):
    """GET /api/projects/{slug}/related returns matching domain projects."""
    _, p1, _, _ = await seed_test_data(db_session)

    resp = await client.get(f"/api/projects/{p1.slug}/related")
    assert resp.status_code == 200
    related = resp.json()
    assert isinstance(related, list)
    # Shouldn't include p1 itself
    for r in related:
        assert r["slug"] != p1.slug


@pytest.mark.asyncio
async def test_create_project_unauthenticated_rejected(client):
    """POST /api/projects without token returns 401."""
    resp = await client.post("/api/projects", json={"title": "Test Proj", "domain": "Web", "short_description": "A short desc"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_project_and_slug_collision(client, db_session):
    """Authenticated student can create a project with multi-step data and slug conflicts are resolved."""
    student, _, _, _ = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "title": "Quantum Algorithm Simulator",
        "domain": "AI / Machine Learning",
        "short_description": "Interactive browser quantum circuit builder and state simulator",
        "difficulty": "Advanced",
        "estimated_duration": "3-4 weeks",
        "tech_stack": ["Python", "Qiskit", "React"],
        "problem_statement": "Students lack hands-on quantum circuit visualizers.",
        "objectives": "Simulate up to 8 qubits in real-time.",
        "features": ["Bloch sphere visualization", "Gate drag-and-drop", "Statevector export"],
        "prerequisites": "Linear algebra, Python fundamentals",
        "expected_outcome": "Working simulator with exportable circuit diagrams",
        "screenshots": [
            {
                "image_url": f"https://img.test/quantum{index + 1}.png",
                "caption": f"Screenshot {index + 1}",
                "order_index": index,
            }
            for index in range(7)
        ],
        "contributors": [
            {"name": "Alice Quantum", "role": "Co-Author", "github_username": "aliceq"}
        ],
        "github_url": "https://github.com/alice/quantum-sim",
        "live_demo_url": "https://quantum-sim.dev",
        "status": "Submitted",
    }

    create_resp = await client.post("/api/projects", json=payload, headers=headers)
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["title"] == "Quantum Algorithm Simulator"
    assert created_data["slug"] == "quantum-algorithm-simulator"
    assert created_data["status"] == "Submitted"
    assert len(created_data["screenshots"]) == 7
    assert created_data["screenshots"][0]["caption"] == "Screenshot 1"
    assert created_data["screenshots"][-1]["order_index"] == 6
    assert len(created_data["contributors"]) == 1
    assert created_data["contributors"][0]["name"] == "Alice Quantum"

    detail_resp = await client.get(f"/api/projects/{created_data['slug']}", headers=headers)
    assert detail_resp.status_code == 200
    assert len(detail_resp.json()["screenshots"]) == 7
    assert detail_resp.json()["screenshots"][-1]["order_index"] == 6

    # Now create another project with identical title to test slug collision resolution
    create_dup_resp = await client.post("/api/projects", json=payload, headers=headers)
    assert create_dup_resp.status_code == 201
    dup_data = create_dup_resp.json()
    assert dup_data["slug"].startswith("quantum-algorithm-simulator-")
    assert dup_data["slug"] != "quantum-algorithm-simulator"


@pytest.mark.asyncio
async def test_update_project_lifecycle_and_forbidden(client, db_session):
    """Owner can update project specs; unauthorized users receive 403."""
    student, p1, _, _ = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    student_token = login_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Another user
    other_user = User(
        email="other@school.edu",
        hashed_password=get_password_hash("OtherPass123!"),
        full_name="Sam Hacker",
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(other_user)
    await db_session.commit()

    other_login = await client.post(
        "/api/auth/login",
        json={"email": "other@school.edu", "password": "OtherPass123!"},
    )
    other_token = other_login.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Other user attempts to update p1 -> 403
    forbidden_resp = await client.put(
        f"/api/projects/{p1.slug}",
        json={"short_description": "Hacked short description here"},
        headers=other_headers,
    )
    assert forbidden_resp.status_code == 403

    # Owner updates p1
    update_payload = {
        "short_description": "Updated portfolio builder with enhanced theme engine",
        "difficulty": "Intermediate",
        "features": ["Clean UI", "Export to PDF", "Theme switcher"],
        "contributors": [
            {"name": "Dev Partner", "role": "UI Designer"}
        ],
    }
    update_resp = await client.put(
        f"/api/projects/{p1.slug}",
        json=update_payload,
        headers=student_headers,
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["short_description"] == "Updated portfolio builder with enhanced theme engine"
    assert updated_data["difficulty"] == "Intermediate"
    assert len(updated_data["features"]) == 3
    assert len(updated_data["contributors"]) == 1
    assert updated_data["contributors"][0]["name"] == "Dev Partner"


@pytest.mark.asyncio
async def test_get_my_submissions_includes_drafts(client, db_session):
    """GET /api/projects/my/submissions returns all projects owned by student including drafts."""
    student, p1, p2, p3 = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    resp = await client.get("/api/projects/my/submissions", headers=headers)
    assert resp.status_code == 200
    my_projects = resp.json()
    assert len(my_projects) == 3
    slugs = [p["slug"] for p in my_projects]
    assert "draft-project" in slugs
    assert "web-portfolio-builder" in slugs
    assert "ai-vision-classifier" in slugs


@pytest.mark.asyncio
async def test_delete_project_by_owner_and_forbidden_by_others(client, db_session):
    """Owner can delete their project/draft; unauthorized users receive 403."""
    student, _, _, p3 = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    student_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Create another student
    other_user = User(
        email="stranger@school.edu",
        hashed_password=get_password_hash("StrangerPass123!"),
        full_name="Stranger User",
        role=UserRole.STUDENT,
        is_active=True,
    )
    db_session.add(other_user)
    await db_session.commit()

    other_login = await client.post(
        "/api/auth/login",
        json={"email": "stranger@school.edu", "password": "StrangerPass123!"},
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    # 1. Other user attempts delete -> 403
    del_forbidden = await client.delete(f"/api/projects/{p3.slug}", headers=other_headers)
    assert del_forbidden.status_code == 403

    # 2. Owner deletes p3 (draft project) -> 200
    del_resp = await client.delete(f"/api/projects/{p3.slug}", headers=student_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["slug"] == p3.slug

    # 3. Verified deleted from catalog
    my_subs = await client.get("/api/projects/my/submissions", headers=student_headers)
    assert my_subs.status_code == 200
    assert len(my_subs.json()) == 2
    assert p3.slug not in [p["slug"] for p in my_subs.json()]


@pytest.mark.asyncio
async def test_create_project_requires_github_or_zip_when_submitted(client, db_session):
    """Submitting a project requires either a GitHub repo URL or ZIP source key, while live demo is optional."""
    student, _, _, _ = await seed_test_data(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "DevPassword123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    base_payload = {
        "title": "Mandatory Code Test Project",
        "domain": "Web Development",
        "short_description": "Validating that either GitHub or ZIP is mandatory on submission.",
        "difficulty": "Beginner",
        "estimated_duration": "1-2 weeks",
        "tech_stack": ["React", "FastAPI"],
        "cover_image_url": "https://images.unsplash.com/photo-test",
        "problem_statement": "Ensuring source code is present for student projects.",
        "features": ["Source code enforcement"],
        "status": "Submitted",
        # Neither github_url, zip_storage_key, nor live_demo_url:
    }

    # 1. No deliverable provided -> Rejected with 400
    fail_resp = await client.post("/api/projects", json=base_payload, headers=headers)
    assert fail_resp.status_code == 400
    assert "deliverable" in fail_resp.json()["detail"].lower()

    # 2. Provide Live Demo URL only -> Accepted with 201
    demo_payload = dict(base_payload)
    demo_payload["title"] = "Live Demo Only Project"
    demo_payload["live_demo_url"] = "https://my-awesome-app.vercel.app"
    ok_demo_resp = await client.post("/api/projects", json=demo_payload, headers=headers)
    assert ok_demo_resp.status_code == 201
    assert ok_demo_resp.json()["live_demo_url"] == "https://my-awesome-app.vercel.app"

    # 3. Provide GitHub URL only -> Accepted with 201
    github_payload = dict(base_payload)
    github_payload["title"] = "GitHub Source Project"
    github_payload["github_url"] = "https://github.com/student/my-project"
    ok_resp = await client.post("/api/projects", json=github_payload, headers=headers)
    assert ok_resp.status_code == 201
    assert ok_resp.json()["github_url"] == "https://github.com/student/my-project"

    # 4. Provide ZIP key only -> Accepted with 201
    zip_payload = dict(base_payload)
    zip_payload["title"] = "ZIP Archive Project"
    zip_payload["zip_storage_key"] = "test-archive-key.zip"
    ok_zip_resp = await client.post("/api/projects", json=zip_payload, headers=headers)
    assert ok_zip_resp.status_code == 201


