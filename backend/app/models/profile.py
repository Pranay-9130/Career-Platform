from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class Profile(BaseUUIDModel):
    """
    Extended student profile entity storing academic credentials,
    skills, social links, and biographical details.
    """
    __tablename__ = "profiles"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    username = Column(String(80), unique=True, index=True, nullable=False)
    headline = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    university = Column(String(200), nullable=True)
    degree = Column(String(100), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    skills = Column(JSON, default=list, nullable=False)

    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<Profile {self.username} (user_id={self.user_id})>"
