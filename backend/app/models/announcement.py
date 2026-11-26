import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel, TimestampMixin


class FeatureAnnouncement(BaseUUIDModel, TimestampMixin):
    """
    Centralized feature announcements published by administrators to notify users
    of newly released platform features.
    """
    __tablename__ = "feature_announcements"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon_or_image = Column(String(500), nullable=True)  # Lucide icon name or image URL
    link_url = Column(String(255), nullable=True)      # e.g. /career-discovery
    link_label = Column(String(100), nullable=False, default="Explore Feature")
    status = Column(String(50), nullable=False, default="PUBLISHED")  # 'DRAFT' | 'PUBLISHED'
    published_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
        index=True,
    )

    # Relationships
    tracking_records = relationship(
        "UserAnnouncementTracking",
        back_populates="announcement",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def to_dict(self):
        return {
            "id": str(self.id) if self.id else None,
            "title": self.title,
            "description": self.description,
            "icon_or_image": self.icon_or_image,
            "link_url": self.link_url,
            "link_label": self.link_label,
            "status": self.status,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserAnnouncementTracking(BaseUUIDModel, TimestampMixin):
    """
    Tracks each user's interaction status with feature announcements.
    Statuses: 'SEEN', 'DISMISSED', 'DEFERRED'
    """
    __tablename__ = "user_announcement_tracking"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    announcement_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("feature_announcements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False, default="SEEN")  # 'SEEN' | 'DISMISSED' | 'DEFERRED'

    __table_args__ = (
        UniqueConstraint("user_id", "announcement_id", name="uq_user_announcement"),
    )

    announcement = relationship("FeatureAnnouncement", back_populates="tracking_records")
    user = relationship("User", backref="announcement_trackings")

    def to_dict(self):
        return {
            "id": str(self.id) if self.id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "announcement_id": str(self.announcement_id) if self.announcement_id else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
