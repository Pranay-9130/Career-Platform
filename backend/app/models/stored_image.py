from sqlalchemy import Column, String, LargeBinary, Uuid, ForeignKey

from app.models.base import BaseUUIDModel


class StoredImage(BaseUUIDModel):
    """Validated project images persisted in the database for durable Render deployments."""

    __tablename__ = "stored_images"

    storage_key = Column(String(100), nullable=False, unique=True, index=True)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    media_type = Column(String(50), nullable=False)
    content = Column(LargeBinary, nullable=False)
