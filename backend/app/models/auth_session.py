from sqlalchemy import Column, String, DateTime, Uuid, ForeignKey
from app.models.base import BaseUUIDModel


class AuthSession(BaseUUIDModel):
    """Server-side session record: only the refresh credential's hash is stored."""
    __tablename__ = "auth_sessions"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)
