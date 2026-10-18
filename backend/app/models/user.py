import enum
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    CONTRIBUTOR = "CONTRIBUTOR"
    ADMIN = "ADMIN"

class User(BaseUUIDModel):
    """
    User entity representing students, administrators, and contributors.
    """
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(
        Enum(UserRole, name="user_role", native_enum=False),
        default=UserRole.STUDENT,
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    # Stable provider identifier. Email is mutable and must not be the sole key
    # used to recognize a returning Google account.
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    headline = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
