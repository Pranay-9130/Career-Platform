import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, JSON, ForeignKey, Uuid, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel


class SkillStatus(str, enum.Enum):
    NOT_STARTED = "Not Started"
    LEARNING = "Learning"
    PRACTICED = "Practiced"
    COMPLETED = "Completed"


class SkillSource(str, enum.Enum):
    MANUAL = "manual"
    RESUME = "resume"
    VERIFIED = "verified"


class StudentTargetRole(BaseUUIDModel):
    """
    Persists student target role preferences, experience level, and career aspirations.
    """
    __tablename__ = "student_target_roles"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    target_role = Column(String(120), nullable=False, index=True)
    experience_level = Column(String(50), nullable=False, default="Student / Entry Level")
    preferences = Column(JSON, default=dict, nullable=False)

    user = relationship("User", backref="target_role_pref", lazy="selectin")

    def __repr__(self) -> str:
        return f"<StudentTargetRole user_id={self.user_id} role={self.target_role}>"


class StudentSkill(BaseUUIDModel):
    """
    Persists student confirmed and extracted skills, sources, and learning progress.
    """
    __tablename__ = "student_skills"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_name = Column(String(100), nullable=False, index=True)
    normalized_name = Column(String(100), nullable=False, index=True)
    category = Column(String(60), nullable=False, default="Technical Skills")
    source = Column(String(30), nullable=False, default="manual")  # 'manual' | 'resume' | 'verified'
    is_confirmed = Column(Boolean, default=True, nullable=False)
    status = Column(
        String(30),
        nullable=False,
        default=SkillStatus.NOT_STARTED.value,
        index=True,
    )
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="student_skills", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", "normalized_name", name="uq_user_normalized_skill"),
        Index("ix_student_skills_user_status", "user_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<StudentSkill {self.skill_name} ({self.status}) user_id={self.user_id}>"
