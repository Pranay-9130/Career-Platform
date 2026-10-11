from sqlalchemy import Column, String, Integer, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class ProjectScreenshot(BaseUUIDModel):
    """
    Screenshots and visual artifacts showcasing the project.
    """
    __tablename__ = "project_screenshots"

    project_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(500), nullable=False)
    caption = Column(String(200), nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    project = relationship("Project", back_populates="screenshots_list")

    def __repr__(self) -> str:
        return f"<ProjectScreenshot (project_id={self.project_id}, order={self.order_index})>"
