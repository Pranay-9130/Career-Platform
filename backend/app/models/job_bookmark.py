from sqlalchemy import Column, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class JobBookmark(BaseUUIDModel):
    """
    Job bookmark entity representing saved job and internship opportunities by a user.
    """
    __tablename__ = "job_bookmarks"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user = relationship("User", backref="job_bookmarks", lazy="selectin")
    job = relationship("Job", backref="bookmarks", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_job_bookmark"),
    )

    def __repr__(self) -> str:
        return f"<JobBookmark (user_id={self.user_id}, job_id={self.job_id})>"
