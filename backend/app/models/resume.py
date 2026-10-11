from sqlalchemy import Column, String, Text, Boolean, JSON, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class Resume(BaseUUIDModel):
    """
    Student ATS resume entity for crafting, storing, and compiling resumes.
    """
    __tablename__ = "resumes"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False, default="Software Engineering Resume")
    template_id = Column(String(50), nullable=False, default="classic-tech")
    personal_info = Column(JSON, default=dict, nullable=False)
    summary = Column(Text, nullable=True, default="")
    education = Column(JSON, default=list, nullable=False)
    experience = Column(JSON, default=list, nullable=False)
    projects = Column(JSON, default=list, nullable=False)
    skills = Column(JSON, default=list, nullable=False)
    certifications = Column(JSON, default=list, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False, index=True)

    user = relationship("User", backref="resumes", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Resume {self.title} (template={self.template_id}, user_id={self.user_id})>"
