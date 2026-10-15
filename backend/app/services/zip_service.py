import io
import os
import re
import uuid
import zipfile
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.stored_archive import StoredArchive

# Security Constants
ZIP_MAGIC_BYTES = b"PK\x03\x04"
MAX_ZIP_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_UNCOMPRESSED_SIZE = 250 * 1024 * 1024  # 250 MB
MAX_ARCHIVE_FILE_COUNT = 2000

IGNORED_GENERATED_DIRECTORIES = {
    "node_modules", ".git", "dist", "build", ".next", "coverage", "__pycache__",
    ".venv", "venv", "target", "out", ".idea", ".vscode",
}

FORBIDDEN_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bat", ".cmd", ".vbs", ".msi", ".com", ".scr"
}

SENSITIVE_FILENAMES = {
    ".env", ".env.local", ".env.development", ".env.test", ".env.production",
    "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"
}

SENSITIVE_EXTENSIONS = {".pem", ".key", ".pfx", ".p12"}

UPLOAD_BASE_DIR = Path("uploads/projects")


async def persist_zip_archive(
    file_bytes: bytes, original_filename: str, owner_id: uuid.UUID,
    db: AsyncSession, project_identifier: Optional[str] = None,
) -> str:
    """Persist validated source files in the database, never an ephemeral host disk."""
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", Path(original_filename).name)
    folder = project_identifier or "staging"
    storage_key = f"{folder}/{Path(safe_name).stem}_{uuid.uuid4().hex}.zip"
    db.add(StoredArchive(storage_key=storage_key, owner_id=owner_id, content=file_bytes))
    await db.flush()
    return storage_key


def prepare_zip_archive(file_bytes: bytes, filename: str = "project.zip") -> Tuple[bytes, Dict[str, Any]]:
    """
    Validates that file_bytes is a genuine, safe ZIP archive:
    1. Verifies binary magic bytes signature (PK\\x03\\x04).
    2. Validates maximum 50 MB compressed size.
    3. Prevents ZIP bombs (checks max uncompressed size 250 MB and file count limit).
    4. Enforces path traversal restrictions (no '..' or leading '/').
    5. Rejects compiled executables (.exe, .dll, .so) and scripts (.bat, .cmd, .vbs).
    6. Rejects leaked credentials (.env, id_rsa, .pem, .key).
    """
    # 1. Magic bytes check
    if len(file_bytes) < 4 or file_bytes[:4] != ZIP_MAGIC_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ZIP file header; file does not appear to be a genuine zip archive.",
        )

    # 2. Maximum file size check
    if len(file_bytes) > MAX_ZIP_UPLOAD_SIZE:
        size_mb = len(file_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ZIP file size ({size_mb:.1f} MB) exceeds the maximum allowed limit of 50 MB.",
        )

    # 3. Parse ZIP archive
    try:
        zf = zipfile.ZipFile(io.BytesIO(file_bytes))
    except (zipfile.BadZipFile, Exception):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupt or malformed ZIP archive.",
        )

    retained_members = []
    ignored_file_count = 0
    total_uncompressed = 0

    # 4. Member-level inspection and generated-file filtering
    for m in zf.infolist():
        raw_name = m.filename

        # Path traversal sequences
        if ".." in raw_name or raw_name.startswith("/") or raw_name.startswith("\\"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: Illegal path traversal sequence detected in archive filename: '{raw_name}'.",
            )

        path_parts = {part.lower() for part in raw_name.replace("\\", "/").split("/") if part}
        if path_parts.intersection(IGNORED_GENERATED_DIRECTORIES):
            if not m.is_dir():
                ignored_file_count += 1
            continue

        retained_members.append(m)

        if not m.is_dir():
            total_uncompressed += m.file_size
            basename = os.path.basename(raw_name).lower()
            ext = os.path.splitext(basename)[1].lower()

            # Prohibited binaries
            if ext in FORBIDDEN_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Security violation: Prohibited executable or script binary detected ('{raw_name}').",
                )

            # Sensitive credentials / private keys
            if basename in SENSITIVE_FILENAMES or ext in SENSITIVE_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Security violation: Sensitive credential or secret key file detected ('{raw_name}'). Strip private keys and .env files before submitting.",
                )

    retained_files = [member for member in retained_members if not member.is_dir()]
    if len(retained_files) > MAX_ARCHIVE_FILE_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Archive contains {len(retained_files)} source files after removing generated folders, which exceeds the limit of {MAX_ARCHIVE_FILE_COUNT}.",
        )

    if total_uncompressed > MAX_UNCOMPRESSED_SIZE:
        uncomp_mb = total_uncompressed / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uncompressed source size ({uncomp_mb:.1f} MB) exceeds the safety limit of 250 MB.",
        )

    prepared_bytes = file_bytes
    if ignored_file_count:
        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as cleaned_zip:
            for member in retained_files:
                cleaned_zip.writestr(member, zf.read(member))
        prepared_bytes = output.getvalue()
    zf.close()

    return prepared_bytes, {
        "file_count": len(retained_files),
        "ignored_file_count": ignored_file_count,
        "uncompressed_size_bytes": total_uncompressed,
        "compressed_size_bytes": len(prepared_bytes),
        "filename": filename,
    }


def validate_and_inspect_zip(file_bytes: bytes, filename: str = "project.zip") -> Dict[str, Any]:
    """Compatibility wrapper returning inspection metadata for callers that do not persist bytes."""
    _, inspection = prepare_zip_archive(file_bytes, filename)
    return inspection


def save_zip_archive(
    file_bytes: bytes,
    original_filename: str = "project.zip",
    project_identifier: Optional[str] = None,
) -> Tuple[str, Path]:
    """
    Persists validated ZIP file bytes to local safe storage.
    Returns (storage_key, full_path).
    """
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", original_filename)
    if not safe_name.lower().endswith(".zip"):
        safe_name += ".zip"

    folder = project_identifier if project_identifier else "staging"
    dest_dir = UPLOAD_BASE_DIR / folder
    dest_dir.mkdir(parents=True, exist_ok=True)

    unique_suffix = uuid.uuid4().hex[:8]
    saved_filename = f"{Path(safe_name).stem}_{unique_suffix}.zip"
    dest_path = dest_dir / saved_filename

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    storage_key = f"{folder}/{saved_filename}"
    return storage_key, dest_path


def get_zip_file_path(storage_key: str) -> Optional[Path]:
    """
    Safely resolves a storage_key to an absolute local filesystem Path.
    Guarantees path cannot escape UPLOAD_BASE_DIR.
    """
    if not storage_key:
        return None

    # Normalization & path traversal check
    clean_key = storage_key.replace("\\", "/").strip("/")
    if ".." in clean_key:
        return None

    full_path = (UPLOAD_BASE_DIR / clean_key).resolve()
    base_resolved = UPLOAD_BASE_DIR.resolve()

    if not full_path.is_relative_to(base_resolved):
        return None

    if full_path.exists() and full_path.is_file():
        return full_path

    return None
