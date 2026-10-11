from sqlalchemy import Column, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class ProjectBookmark(BaseUUIDModel):
    """
    Project bookmark entity representing saved projects by a user.
    """
    __tablename__ = "project_bookmarks"

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

    user = relationship("User", backref="project_bookmarks", lazy="selectin")
    project = relationship("Project", backref="bookmarks", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", "project_id", name="uq_user_project_bookmark"),
    )

    def __repr__(self) -> str:
        return f"<ProjectBookmark (user_id={self.user_id}, project_id={self.project_id})>"
