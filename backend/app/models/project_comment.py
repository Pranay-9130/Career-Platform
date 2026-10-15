from sqlalchemy import Column, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseUUIDModel


class ProjectComment(BaseUUIDModel):
    """A public appreciation comment left on a published project."""

    __tablename__ = "project_comments"

    project_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    body = Column(String(1000), nullable=False)

    project = relationship("Project", backref="comment_records", lazy="selectin")
    user = relationship("User", backref="project_comments", lazy="selectin")
