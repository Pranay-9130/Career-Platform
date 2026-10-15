import io
import zipfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.stored_archive import StoredArchive
from app.models.stored_image import StoredImage
from sqlalchemy import select
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


async def seed_user_and_project(session: AsyncSession):
    student = User(
        email="builder@campus.edu",
        hashed_password=get_password_hash("SecretPass123!"),
        full_name="Alex Builder",
        role=UserRole.STUDENT,
        is_active=True,
    )
    session.add(student)
    await session.commit()
    await session.refresh(student)

    project = Project(
        owner_id=student.id,
        title="Zip Test Repository",
        slug="zip-test-repository",
        domain="Web Development",
        short_description="Testing secure zip upload and presigning",
        status="Published",
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    return student, project


def create_in_memory_zip(file_dict: dict) -> bytes:
    """Helper to generate an in-memory ZIP binary from filename -> content map."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname, content in file_dict.items():
            zf.writestr(fname, content)
    buf.seek(0)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_upload_standalone_zip_success(client, db_session):
    """Uploading a genuine, clean ZIP package returns 200 with metadata and storage key."""
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    zip_bytes = create_in_memory_zip({
        "src/main.py": "print('hello world')",
        "README.md": "# Project Title\nClear documentation.",
    })

    files = {"file": ("codebase.zip", zip_bytes, "application/zip")}
    response = await client.post("/api/projects/upload-zip", files=files, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["zip_storage_key"].endswith(".zip")
    assert data["files_count"] == 2
    assert data["zip_file_size_bytes"] == len(zip_bytes)


@pytest.mark.asyncio
async def test_upload_standalone_zip_invalid_magic_bytes(client, db_session):
    """Files lacking PK\\x03\\x04 signature are rejected with 400 Bad Request."""
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    fake_bytes = b"NOT_A_ZIP_HEADER_CONTENT"
    files = {"file": ("spoofed.zip", fake_bytes, "application/zip")}
    response = await client.post("/api/projects/upload-zip", files=files, headers=headers)

    assert response.status_code == 400
    assert "Invalid ZIP file header" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_standalone_zip_forbidden_executable(client, db_session):
    """Archives containing executable binaries (.exe, .dll, .so) are strictly rejected."""
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    malicious_zip = create_in_memory_zip({
        "bin/malware.exe": "fake binary content",
        "README.md": "Documentation",
    })

    files = {"file": ("malicious.zip", malicious_zip, "application/zip")}
    response = await client.post("/api/projects/upload-zip", files=files, headers=headers)

    assert response.status_code == 400
    assert "Prohibited executable or script binary detected" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_standalone_zip_sensitive_env_file(client, db_session):
    """Archives containing leaked credentials (.env, id_rsa) are blocked."""
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    env_zip = create_in_memory_zip({
        ".env": "SECRET_KEY=12345",
        "app.py": "print('ok')",
    })

    files = {"file": ("leaked_env.zip", env_zip, "application/zip")}
    response = await client.post("/api/projects/upload-zip", files=files, headers=headers)

    assert response.status_code == 400
    assert "Sensitive credential or secret key file detected" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_zip_removes_generated_dependency_folders(client, db_session):
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    zip_bytes = create_in_memory_zip({
        "src/main.py": "print('source')",
        "node_modules/package/index.js": "generated",
        "dist/bundle.js": "generated",
    })

    response = await client.post(
        "/api/projects/upload-zip",
        files={"file": ("project.zip", zip_bytes, "application/zip")},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["files_count"] == 1
    assert response.json()["ignored_files_count"] == 2
    stored = (await db_session.execute(select(StoredArchive))).scalar_one()
    with zipfile.ZipFile(io.BytesIO(stored.content)) as cleaned:
        assert cleaned.namelist() == ["src/main.py"]


@pytest.mark.asyncio
async def test_upload_and_serve_project_image(client, db_session):
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"test-image-data"

    upload = await client.post(
        "/api/projects/upload-image",
        files={"file": ("screen.png", png_bytes, "image/png")},
        headers=headers,
    )

    assert upload.status_code == 200
    image_url = upload.json()["image_url"]
    stored = (await db_session.execute(select(StoredImage))).scalar_one()
    assert stored.owner_id == student.id
    image = await client.get(image_url)
    assert image.status_code == 200
    assert image.headers["content-type"] == "image/png"
    assert image.content == png_bytes


@pytest.mark.asyncio
async def test_project_image_rejects_spoofed_content(client, db_session):
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    response = await client.post(
        "/api/projects/upload-image",
        files={"file": ("fake.png", b"not-an-image", "image/png")},
        headers=headers,
    )

    assert response.status_code == 400
    assert "Unsupported image" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_standalone_zip_path_traversal(client, db_session):
    """Archives containing path traversal sequences are rejected."""
    student, _ = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    traversal_zip = create_in_memory_zip({
        "../../etc/passwd": "root:x:0:0:",
    })

    files = {"file": ("traversal.zip", traversal_zip, "application/zip")}
    response = await client.post("/api/projects/upload-zip", files=files, headers=headers)

    assert response.status_code == 400
    assert "Illegal path traversal sequence" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_project_zip_and_download_lifecycle(client, db_session):
    """Uploading to an existing project updates record and enables secure file download."""
    student, project = await seed_user_and_project(db_session)
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": student.email, "password": "SecretPass123!"},
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    zip_bytes = create_in_memory_zip({
        "src/app.py": "import os\nprint('Production Service')",
        "package.json": "{\"name\": \"service\"}",
    })

    # 1. Upload ZIP directly to project
    files = {"file": ("source.zip", zip_bytes, "application/zip")}
    upload_resp = await client.post(
        f"/api/projects/{project.slug}/upload-zip",
        files=files,
        headers=headers,
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert upload_data["zip_file_size_bytes"] == len(zip_bytes)
    stored = (await db_session.execute(select(StoredArchive).where(
        StoredArchive.storage_key == upload_data['zip_storage_key']
    ))).scalar_one()
    assert stored.content == zip_bytes
    assert stored.owner_id == student.id
    # Clear the identity map: download must retrieve persistent database bytes.
    db_session.expunge(stored)

    # 2. Download ZIP file
    download_resp = await client.get(f"/api/projects/{project.slug}/download")
    assert download_resp.status_code == 200
    assert download_resp.headers["content-type"] == "application/zip"
    assert "attachment" in download_resp.headers["content-disposition"]
    assert len(download_resp.content) == len(zip_bytes)


@pytest.mark.asyncio
async def test_download_unpublished_draft_rejected_for_strangers(client, db_session):
    """Unpublished drafts cannot be downloaded by unauthenticated users or strangers."""
    student, project = await seed_user_and_project(db_session)
    project.status = "Draft"
    project.zip_storage_key = "staging/sample.zip"
    await db_session.commit()

    # Anonymous download -> 403
    resp_anon = await client.get(f"/api/projects/{project.slug}/download")
    assert resp_anon.status_code == 403
