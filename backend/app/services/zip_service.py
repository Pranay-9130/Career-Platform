import io
import os
import re
import uuid
import zipfile
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from fastapi import HTTPException, status

# Security Constants
ZIP_MAGIC_BYTES = b"PK\x03\x04"
MAX_ZIP_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_UNCOMPRESSED_SIZE = 250 * 1024 * 1024  # 250 MB
MAX_ARCHIVE_FILE_COUNT = 2000

FORBIDDEN_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bat", ".cmd", ".vbs", ".msi", ".com", ".scr"
}

SENSITIVE_FILENAMES = {
    ".env", ".env.local", ".env.development", ".env.test", ".env.production",
    "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"
}

SENSITIVE_EXTENSIONS = {".pem", ".key", ".pfx", ".p12"}

UPLOAD_BASE_DIR = Path("uploads/projects")


def validate_and_inspect_zip(file_bytes: bytes, filename: str = "project.zip") -> Dict[str, Any]:
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

    members = zf.infolist()

    # File count limit (zip bomb protection)
    if len(members) > MAX_ARCHIVE_FILE_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Archive contains {len(members)} files, which exceeds the limit of {MAX_ARCHIVE_FILE_COUNT}. Please exclude build artifacts such as node_modules/.",
        )

    # Total uncompressed size limit
    total_uncompressed = sum(m.file_size for m in members)
    if total_uncompressed > MAX_UNCOMPRESSED_SIZE:
        uncomp_mb = total_uncompressed / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uncompressed archive size ({uncomp_mb:.1f} MB) exceeds the safety limit of 250 MB.",
        )

    # 4. Member-level inspection
    for m in members:
        raw_name = m.filename

        # Path traversal sequences
        if ".." in raw_name or raw_name.startswith("/") or raw_name.startswith("\\"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: Illegal path traversal sequence detected in archive filename: '{raw_name}'.",
            )

        if not m.is_dir():
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

    return {
        "file_count": len(members),
        "uncompressed_size_bytes": total_uncompressed,
        "compressed_size_bytes": len(file_bytes),
        "filename": filename,
    }


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

    if not str(full_path).startswith(str(base_resolved)):
        return None

    if full_path.exists() and full_path.is_file():
        return full_path

    return None
