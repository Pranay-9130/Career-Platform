from sqlalchemy import Column, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseUUIDModel


class ProjectStar(BaseUUIDModel):
    """A durable, one-per-user endorsement of a project."""

    __tablename__ = "project_stars"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship("User", backref="project_stars", lazy="selectin")
    project = relationship("Project", backref="star_records", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", "project_id", name="uq_user_project_star"),
    )
