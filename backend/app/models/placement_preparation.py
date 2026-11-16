import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Uuid, LargeBinary
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class PreparationRole(BaseUUIDModel):
    """
    Job role track for technical placement preparation materials.
    E.g. Python Developer, Java Developer, Frontend Developer.
    """
    __tablename__ = "preparation_roles"

    name = Column(String(150), nullable=False, index=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(50), nullable=False, default="Terminal")
    is_active = Column(Boolean, default=True, server_default="true", nullable=False, index=True)
    display_order = Column(Integer, default=0, server_default="0", nullable=False)

    topics = relationship(
        "PreparationTopic",
        back_populates="role",
        cascade="all, delete-orphan",
        order_by="PreparationTopic.display_order",
    )
    materials = relationship(
        "PreparationMaterial",
        back_populates="role",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<PreparationRole {self.name} (slug={self.slug})>"


class PreparationTopic(BaseUUIDModel):
    """
    Topic or category under a role.
    E.g. Python Fundamentals, OOP, Data Structures, SQL, Interview Questions.
    """
    __tablename__ = "preparation_topics"

    role_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("preparation_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(150), nullable=False, index=True)
    slug = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    role = relationship("PreparationRole", back_populates="topics")
    materials = relationship("PreparationMaterial", back_populates="topic")

    def __repr__(self) -> str:
        return f"<PreparationTopic {self.name} (role_id={self.role_id})>"


class PreparationMaterial(BaseUUIDModel):
    """
    Admin-managed technical preparation PDF document.
    """
    __tablename__ = "preparation_materials"

    role_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("preparation_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("preparation_topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_content = Column(LargeBinary, nullable=True)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    page_count = Column(Integer, nullable=False, default=1, server_default="1")
    is_published = Column(Boolean, default=True, server_default="true", nullable=False, index=True)
    download_count = Column(Integer, default=0, server_default="0", nullable=False)
    uploaded_by_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    role = relationship("PreparationRole", back_populates="materials")
    topic = relationship("PreparationTopic", back_populates="materials")

    def __repr__(self) -> str:
        return f"<PreparationMaterial {self.title} (published={self.is_published})>"
