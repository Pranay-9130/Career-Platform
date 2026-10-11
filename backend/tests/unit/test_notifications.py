import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.notification import Notification
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

student_1 = User(
    id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
    email="student1@university.edu",
    hashed_password="hash",
    full_name="Student One",
    role=UserRole.STUDENT,
    is_active=True,
    is_verified=True,
)

student_2 = User(
    id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
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
async def test_unauthenticated_notifications_rejected(client):
    """Unauthenticated requests to notifications are rejected with 401."""
    resp = await client.get("/api/notifications")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_notifications_crud_and_counts(client, db_session):
    """Student can list notifications, view unread count, mark as read, and delete."""
    app.dependency_overrides[get_current_active_user] = lambda: student_1

    db_session.add(student_1)
    n1 = Notification(
        user_id=student_1.id,
        title="Welcome to Platform",
        message="Your account is active.",
        type="INFO",
        is_read=False,
    )
    n2 = Notification(
        user_id=student_1.id,
        title="Project Approved",
        message="Your project is published.",
        type="SUCCESS",
        is_read=False,
    )
    db_session.add_all([n1, n2])
    await db_session.commit()

    # 1. Check unread count
    count_resp = await client.get("/api/notifications/unread-count")
    assert count_resp.status_code == 200
    assert count_resp.json()["unread_count"] == 2

    # 2. List notifications
    list_resp = await client.get("/api/notifications")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 2

    # 3. Mark single as read
    read_resp = await client.put(f"/api/notifications/{n1.id}/read")
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True

    # Check unread count decreased to 1
    count_after = await client.get("/api/notifications/unread-count")
    assert count_after.json()["unread_count"] == 1

    # 4. Mark all read
    all_read_resp = await client.put("/api/notifications/read-all")
    assert all_read_resp.status_code == 200

    # Unread count should now be 0
    count_zero = await client.get("/api/notifications/unread-count")
    assert count_zero.json()["unread_count"] == 0

    # 5. Delete notification
    del_resp = await client.delete(f"/api/notifications/{n1.id}")
    assert del_resp.status_code == 204

    # Verify deleted
    list_final = await client.get("/api/notifications")
    assert len(list_final.json()) == 1


@pytest.mark.asyncio
async def test_notification_cross_user_isolation(client, db_session):
    """Students cannot mark or delete notifications belonging to other users."""
    db_session.add_all([student_1, student_2])
    n = Notification(
        user_id=student_1.id,
        title="Private alert",
        message="Secret data",
        is_read=False,
    )
    db_session.add(n)
    await db_session.commit()

    # Act as student 2
    app.dependency_overrides[get_current_active_user] = lambda: student_2

    resp_read = await client.put(f"/api/notifications/{n.id}/read")
    assert resp_read.status_code == 403

    resp_del = await client.delete(f"/api/notifications/{n.id}")
    assert resp_del.status_code == 403


@pytest.mark.asyncio
async def test_moderation_triggers_notification(client, db_session):
    """When an admin approves or requests changes on a student project, an in-app notification is sent."""
    db_session.add_all([admin_user, student_1])
    proj = Project(
        owner_id=student_1.id,
        title="Autonomous Rover",
        slug="autonomous-rover",
        short_description="Robotics simulation",
        status="Submitted",
    )
    db_session.add(proj)
    await db_session.commit()

    # Admin approves
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    resp_mod = await client.post(
        f"/api/admin/projects/{proj.id}/moderate",
        json={"action": "approve", "reviewer_notes": "Great project!"},
    )
    assert resp_mod.status_code == 200

    # Check student 1 notifications
    app.dependency_overrides[get_current_active_user] = lambda: student_1
    notifs_resp = await client.get("/api/notifications")
    assert notifs_resp.status_code == 200
    notifs = notifs_resp.json()
    assert len(notifs) >= 1
    assert "Project Approved" in notifs[0]["title"]
    assert notifs[0]["type"] == "SUCCESS"
