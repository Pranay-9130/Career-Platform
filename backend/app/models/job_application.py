from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseUUIDModel

class JobApplication(BaseUUIDModel):
    """
    Student job application tracking entity in their career pipeline.
    """
    __tablename__ = "job_applications"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    company_name = Column(String(200), nullable=False)
    position_title = Column(String(200), nullable=False)
    job_location = Column(String(150), nullable=True, default="Remote")
    work_mode = Column(String(50), nullable=True, default="Remote")
    salary_or_stipend = Column(String(100), nullable=True)
    job_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="Applied", index=True)  # Saved, Applied, Interviewing, Offer, Rejected
    applied_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    next_interview_date = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", backref="applications", lazy="selectin")
    job = relationship("Job", backref="applications", lazy="selectin")

    def __repr__(self) -> str:
        return f"<JobApplication {self.position_title} at {self.company_name} (status={self.status})>"
