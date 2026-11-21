from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Uuid, ForeignKey
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
        now = datetime.now(timezone.utc)
        return now > self.expires_at

    @property
    def is_valid(self) -> bool:
        return self.invalidated_at is None and not self.is_expired

    def __repr__(self) -> str:
        return f"<PasswordResetToken {self.email} expires={self.expires_at}>"


class PasswordResetOTP(BaseUUIDModel):
    """
    Stores cryptographically hashed 6-digit OTP codes for secure password recovery,
    tracking attempts, expiration (5 min), verification state, and reset tokens.
    """
    __tablename__ = "password_reset_otps"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    email = Column(String(255), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    reset_token_hash = Column(String(255), nullable=True, index=True)
    reset_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_used = Column(Boolean, nullable=False, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)

    @property
    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        target = self.expires_at.replace(tzinfo=timezone.utc) if self.expires_at.tzinfo is None else self.expires_at
        return now > target

    @property
    def is_reset_token_expired(self) -> bool:
        if not self.reset_token_expires_at:
            return True
        now = datetime.now(timezone.utc)
        target = (
            self.reset_token_expires_at.replace(tzinfo=timezone.utc)
            if self.reset_token_expires_at.tzinfo is None
            else self.reset_token_expires_at
        )
        return now > target

    @property
    def is_active(self) -> bool:
        return (
            not self.is_used
            and self.invalidated_at is None
            and not self.is_expired
            and self.attempt_count < self.max_attempts
        )

    def __repr__(self) -> str:
        return f"<PasswordResetOTP {self.email} verified={self.is_verified} used={self.is_used}>"
