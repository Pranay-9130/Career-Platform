from sqlalchemy import Column, String, Text, Boolean, JSON, DateTime
from datetime import datetime, timezone
from app.models.base import BaseUUIDModel

class Job(BaseUUIDModel):
    """
    Job and Internship opportunity entity for student discovery.
    """
    __tablename__ = "jobs"

    title = Column(String(200), nullable=False, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    company_logo_url = Column(String(500), nullable=True)
    company_website = Column(String(500), nullable=True)
    domain = Column(String(100), nullable=False, default="Software Engineering", index=True)
    job_type = Column(String(50), nullable=False, default="Full-time", index=True)  # Internship, Full-time, Contract
    work_mode = Column(String(50), nullable=False, default="Remote", index=True)     # Remote, Hybrid, Onsite
    location = Column(String(150), nullable=False, default="Remote")
    stipend_or_salary = Column(String(100), nullable=True, default="")
    experience_level = Column(String(50), nullable=False, default="Entry Level", index=True)  # Internship, Entry Level, Mid-Level
    skills_required = Column(JSON, default=list, nullable=False)
    description = Column(Text, nullable=False, default="")
    responsibilities = Column(JSON, default=list, nullable=False)
    requirements = Column(JSON, default=list, nullable=False)
    apply_url = Column(String(500), nullable=True, default="")
    application_method = Column(String(50), nullable=False, default="INTERNAL", server_default="INTERNAL", index=True)
    application_url = Column(String(500), nullable=True)
    recruiter_email = Column(String(255), nullable=True)
    application_instructions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    is_featured = Column(Boolean, default=False, index=True, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Job {self.title} at {self.company_name} (type={self.job_type}, mode={self.work_mode})>"
