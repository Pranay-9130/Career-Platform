from sqlalchemy import Column, String, LargeBinary, Uuid, ForeignKey
from app.models.base import BaseUUIDModel


class StoredArchive(BaseUUIDModel):
    """Validated source archives persisted alongside the project database."""
    __tablename__ = "stored_archives"

    storage_key = Column(String(500), nullable=False, unique=True, index=True)
    owner_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(LargeBinary, nullable=False)
