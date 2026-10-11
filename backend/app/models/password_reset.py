from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Uuid, ForeignKey
from app.models.base import BaseUUIDModel

class PasswordResetToken(BaseUUIDModel):
    """
    Stores cryptographic hashes of single-use password reset tokens
    with strict expiration and invalidation timestamps.
    """
    __tablename__ = "password_reset_tokens"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email = Column(String(255), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)

    @property
    def is_expired(self) -> bool:
        """Determines whether the token has expired."""
        now = datetime.now(timezone.utc)
        return now > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Determines whether the token is active and unspent."""
        return self.invalidated_at is None and not self.is_expired

    def __repr__(self) -> str:
        return f"<PasswordResetToken {self.email} expires={self.expires_at}>"
