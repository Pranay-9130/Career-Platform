from sqlalchemy import Column, String, Text, Integer, JSON, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseUUIDModel

class Project(BaseUUIDModel):
    """
    Project showcase entity representing student submissions and platform curated guides.
    """
    __tablename__ = "projects"

    owner_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    slug = Column(String(250), unique=True, index=True, nullable=False)
    short_description = Column(String(300), nullable=False)
    problem_statement = Column(Text, nullable=False, default="")
    objectives = Column(Text, nullable=True)
    features = Column(JSON, default=list, nullable=False)
    tech_stack = Column(JSON, default=list, nullable=False)
    prerequisites = Column(Text, nullable=True)
    difficulty = Column(String(30), nullable=False, default="Intermediate", index=True)
    estimated_duration = Column(String(50), nullable=True, default="2-3 weeks")
    expected_outcome = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    screenshots = Column(JSON, default=list, nullable=False)
    contributors = Column(JSON, default=list, nullable=False)
    zip_storage_key = Column(String(500), nullable=True)
    zip_file_size_bytes = Column(Integer, default=0, nullable=False)
    github_url = Column(String(500), nullable=True)
    live_demo_url = Column(String(500), nullable=True)
    video_demo_url = Column(String(500), nullable=True)
    domain = Column(String(100), nullable=False, default="Web Development", index=True)
    status = Column(String(50), nullable=False, default="Published", index=True)
    published_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
    reviewer_notes = Column(Text, nullable=True)
    views_count = Column(Integer, default=0, nullable=False)
    stars_count = Column(Integer, default=0, nullable=False)
    bookmarks_count = Column(Integer, default=0, nullable=False)

    owner = relationship("User", backref="projects", lazy="selectin")
    screenshots_list = relationship(
        "ProjectScreenshot",
        back_populates="project",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project {self.title} (slug={self.slug}, status={self.status})>"
