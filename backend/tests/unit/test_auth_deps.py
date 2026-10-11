import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User, UserRole
from app.api.dependencies.auth import get_current_active_user

# Mock users for dependency verification
mock_student = User(
    id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
    email="student@university.edu",
    hashed_password="hash",
    full_name="Alex Student",
    role=UserRole.STUDENT,
    is_active=True,
    is_verified=True,
)

mock_admin = User(
    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
    email="admin@careerplatform.com",
    hashed_password="hash",
    full_name="Morgan Admin",
    role=UserRole.ADMIN,
    is_active=True,
    is_verified=True,
)

@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Unauthenticated requests must receive 401 Unauthorized."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Clear any overrides
        app.dependency_overrides.clear()
        response = await client.get("/api/auth/me")
        assert response.status_code == 401
        assert "WWW-Authenticate" in response.headers

@pytest.mark.asyncio
async def test_student_can_access_student_route():
    """Student role can access student-only routes."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_student
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/student-only")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Alex Student" in data["message"]
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_student_forbidden_from_admin_route():
    """Student role must be forbidden (403) from admin-only routes."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_student
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/admin-only")
        assert response.status_code == 403
        data = response.json()
        assert "Required role: 'ADMIN'" in data["detail"]
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_admin_can_access_admin_route():
    """Admin role can access admin-only routes."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/admin-only")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Morgan Admin" in data["message"]
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_admin_can_access_student_route():
    """Admin role also possesses clearance to access student-level routes."""
    app.dependency_overrides[get_current_active_user] = lambda: mock_admin
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/student-only")
        assert response.status_code == 200
    app.dependency_overrides.clear()
