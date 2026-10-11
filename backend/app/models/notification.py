from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from app.models.base import BaseUUIDModel

class Notification(BaseUUIDModel):
    """
    In-app notification entity for alerts, moderation updates, and application reminders.
    """
    __tablename__ = "notifications"

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="INFO")  # INFO, SUCCESS, WARNING, MODERATION, APPLICATION
    link_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    user = relationship("User", backref="notifications", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notification {self.title} (user_id={self.user_id}, read={self.is_read})>"
