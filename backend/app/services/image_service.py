import re
import uuid
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stored_image import StoredImage


MAX_PROJECT_IMAGE_SIZE = 5 * 1024 * 1024


def detect_project_image_type(content: bytes) -> tuple[str, str]:
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif", ".gif"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp", ".webp"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported image. Upload a genuine PNG, JPEG, WebP, or GIF file.",
    )


async def persist_project_image(
    content: bytes,
    original_filename: str,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> StoredImage:
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected image is empty.")
    if len(content) > MAX_PROJECT_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image exceeds the 5 MB upload limit.")

    media_type, extension = detect_project_image_type(content)
    safe_stem = re.sub(r"[^a-zA-Z0-9._-]", "_", Path(original_filename).stem)[:80] or "project-image"
    stored = StoredImage(
        storage_key=f"{uuid.uuid4().hex}{extension}",
        owner_id=owner_id,
        filename=f"{safe_stem}{extension}",
        media_type=media_type,
        content=content,
    )
    db.add(stored)
    await db.flush()
    return stored
