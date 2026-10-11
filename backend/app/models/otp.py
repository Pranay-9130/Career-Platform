from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Uuid, ForeignKey
from app.models.base import BaseUUIDModel

class OTPVerification(BaseUUIDModel):
    """
    Stores cryptographically hashed one-time passwords for email verification,
    password reset challenges, and account actions.
    """
    __tablename__ = "otp_verifications"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    email = Column(String(255), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), default="registration", nullable=False, index=True)
    attempt_count = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)

    @property
    def is_expired(self) -> bool:
        """Checks if the OTP has passed its expiration timestamp."""
        now = datetime.now(timezone.utc)
        return now > self.expires_at

    @property
    def is_active(self) -> bool:
        """Determines if the OTP is currently usable."""
        return (
            self.invalidated_at is None
            and not self.is_expired
            and self.attempt_count < self.max_attempts
        )

    def __repr__(self) -> str:
        return f"<OTPVerification {self.email} ({self.purpose}) attempts={self.attempt_count}/{self.max_attempts}>"
