import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import inspect

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.core.rate_limiter import (
    contact_rate_limiter,
    auth_rate_limiter,
    SlidingWindowRateLimiter,
)
from app.models.user import User, UserRole
from app.models.profile import Profile
from app.models.project import Project
from app.models.project_bookmark import ProjectBookmark
from app.models.job_bookmark import JobBookmark
from app.models.resume import Resume
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
async def test_owasp_security_headers_on_all_responses(client):
    """
    Verify OWASP Security Headers are enforced by SecurityHeadersMiddleware
    on root, health check, and API endpoints.
    """
    for endpoint in ["/", "/api/health"]:
        response = await client.get(endpoint)
        assert response.status_code == 200
        headers = response.headers

        # Verify OWASP defense-in-depth headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "geolocation=()" in headers.get("Permissions-Policy", "")
        assert "Strict-Transport-Security" in headers


@pytest.mark.asyncio
async def test_template_pdf_download_and_preview_security_headers(client, db_session):
    """
    Verify template PDF download endpoint returns HTTP 200, serves valid PDF,
    removes X-Frame-Options without MutableHeaders.pop AttributeError,
    and sets CSP frame-ancestors * while preserving other security headers.
    """
    from app.models.stored_archive import StoredArchive
    import uuid

    test_user = User(
        id=uuid.uuid4(),
        email=f"archive_admin_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="hash",
        full_name="Archive Admin",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(test_user)

    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
    test_key = f"tpl_{uuid.uuid4().hex}_clean_resume.pdf"

    archive = StoredArchive(
        storage_key=test_key,
        owner_id=test_user.id,
        content=valid_pdf_bytes,
    )
    db_session.add(archive)
    await db_session.commit()

    # 1. Preview request (inline)
    preview_resp = await client.get(f"/api/resumes/templates/file/{test_key}")
    assert preview_resp.status_code == 200
    assert preview_resp.content.startswith(b"%PDF-")
    assert preview_resp.headers.get("Content-Type") == "application/pdf"
    assert "X-Frame-Options" not in preview_resp.headers
    assert preview_resp.headers.get("Content-Security-Policy") == "frame-ancestors *"
    assert preview_resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert "inline" in preview_resp.headers.get("Content-Disposition", "")

    # 2. Download request (attachment with download=1)
    download_resp = await client.get(f"/api/resumes/templates/file/{test_key}?download=1")
    assert download_resp.status_code == 200
    assert download_resp.content.startswith(b"%PDF-")
    assert download_resp.headers.get("Content-Type") == "application/pdf"
    assert "X-Frame-Options" not in download_resp.headers
    assert download_resp.headers.get("Content-Security-Policy") == "frame-ancestors *"
    assert "attachment" in download_resp.headers.get("Content-Disposition", "")


@pytest.mark.asyncio
async def test_security_headers_middleware_mutable_headers_compatibility():
    """
    Directly verify SecurityHeadersMiddleware does not use MutableHeaders.pop()
    and correctly modifies headers using dictionary operations.
    """
    from starlette.requests import Request
    from starlette.responses import Response
    from app.core.middleware import SecurityHeadersMiddleware

    middleware = SecurityHeadersMiddleware(app=None)

    # 1. Template route should remove X-Frame-Options
    scope_template = {
        "type": "http",
        "method": "GET",
        "path": "/api/resumes/templates/file/sample.pdf",
        "headers": [],
    }
    req_template = Request(scope_template)

    async def call_next_template(request):
        resp = Response("pdf-data", media_type="application/pdf")
        resp.headers["X-Frame-Options"] = "DENY"
        return resp

    resp_template = await middleware.dispatch(req_template, call_next_template)
    assert "X-Frame-Options" not in resp_template.headers
    assert resp_template.headers["Content-Security-Policy"] == "frame-ancestors *"
    assert resp_template.headers["X-Content-Type-Options"] == "nosniff"

    # 2. Standard route should enforce X-Frame-Options: DENY
    scope_standard = {
        "type": "http",
        "method": "GET",
        "path": "/api/jobs",
        "headers": [],
    }
    req_standard = Request(scope_standard)

    async def call_next_standard(request):
        return Response("json-data", media_type="application/json")

    resp_standard = await middleware.dispatch(req_standard, call_next_standard)
    assert resp_standard.headers["X-Frame-Options"] == "DENY"
    assert resp_standard.headers["X-Content-Type-Options"] == "nosniff"


@pytest.mark.asyncio
async def test_sliding_window_rate_limiter_unit_logic():
    """
    Direct unit test of SlidingWindowRateLimiter enforcing max requests
    and calculating retry-after countdown.
    """
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=10, name="UnitTestLimiter")
    client_key = "test_ip_1"

    # Requests 1, 2, 3 must pass
    limiter.check(client_key)
    limiter.check(client_key)
    limiter.check(client_key)

    # 4th request must raise 429
    with pytest.raises(Exception) as exc_info:
        limiter.check(client_key)

    exc = exc_info.value
    assert getattr(exc, "status_code", None) == 429
    assert "Retry-After" in exc.headers

    # Reset clears history
    limiter.reset()
    limiter.check(client_key)  # Passes without raising


@pytest.mark.asyncio
async def test_contact_route_rate_limiting_enforcement(client):
    """
    Verify contact route triggers HTTP 429 when inquiry burst exceeds limit (5/min).
    """
    contact_rate_limiter.reset()
    payload = {
        "name": "Jane Candidate",
        "email": "jane@campus.edu",
        "subject": "Platform Partnership",
        "message": "We would like to connect regarding university hiring initiatives.",
    }

    # First 5 submissions succeed
    for _ in range(5):
        resp = await client.post("/api/contact", json=payload)
        assert resp.status_code == 201

    # 6th burst submission must be rate limited
    blocked_resp = await client.post("/api/contact", json=payload)
    assert blocked_resp.status_code == 429
    assert "Retry-After" in blocked_resp.headers
    assert "Too many requests to ContactLimiter" in blocked_resp.json()["detail"]


@pytest.mark.asyncio
async def test_auth_route_rate_limiting_enforcement(client, db_session):
    """
    Verify auth route triggers HTTP 429 when login attempt burst exceeds limit (10/min).
    """
    auth_rate_limiter.reset()
    bad_login = {
        "email": "hacker@bruteforce.com",
        "password": "wrongpassword123",
    }

    # First 10 attempts return 401 Unauthorized
    for _ in range(10):
        resp = await client.post("/api/auth/login", json=bad_login)
        assert resp.status_code == 401

    # 11th attempt must be cut off with 429
    blocked_resp = await client.post("/api/auth/login", json=bad_login)
    assert blocked_resp.status_code == 429
    assert "Retry-After" in blocked_resp.headers
    assert "AuthLimiter" in blocked_resp.json()["detail"]


@pytest.mark.asyncio
async def test_role_tampering_and_privilege_escalation_defense(client, db_session):
    """
    Verify student role is strictly rejected (403 Forbidden) when attempting
    to access administrator endpoints.
    """
    student = User(
        email="regular_student@university.edu",
        hashed_password=get_password_hash("Student123!"),
        full_name="Alex Regular",
        role=UserRole.STUDENT,
        is_active=True,
        is_verified=True,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    student_token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": student.role.value}
    )
    headers = {"Authorization": f"Bearer {student_token}"}

    # Attempt to access admin stats endpoint
    admin_resp = await client.get("/api/admin/stats", headers=headers)
    assert admin_resp.status_code == 403
    assert "Required role: 'ADMIN'" in admin_resp.json()["detail"]


def test_database_model_constraints_and_indexes():
    """
    Verify database schema enforces primary integrity constraints:
    - User email index and uniqueness
    - Bookmark unique composite constraint (user_id, project_id) & (user_id, job_id)
    - Project slug index and uniqueness
    - Resume user_id index
    """
    # User model checks
    user_table = User.__table__
    email_col = user_table.columns["email"]
    assert email_col.unique is True or any(
        idx.unique and "email" in [c.name for c in idx.columns] for idx in user_table.indexes
    )

    # Project model checks
    project_table = Project.__table__
    slug_col = project_table.columns["slug"]
    assert slug_col.unique is True or any(
        idx.unique and "slug" in [c.name for c in idx.columns] for idx in project_table.indexes
    )

    # Bookmark model checks
    pb_table = ProjectBookmark.__table__
    pb_constraint_names = [c.name for c in pb_table.constraints]
    assert "uq_user_project_bookmark" in pb_constraint_names

    jb_table = JobBookmark.__table__
    jb_constraint_names = [c.name for c in jb_table.constraints]
    assert "uq_user_job_bookmark" in jb_constraint_names

    # Resume model checks
    resume_table = Resume.__table__
    assert "user_id" in resume_table.columns
    assert resume_table.columns["user_id"].foreign_keys is not None
