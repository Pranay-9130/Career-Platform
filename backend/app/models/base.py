import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Uuid
from app.core.database import Base

class TimestampMixin:
    """Provides created_at and updated_at timestamp columns in UTC."""
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

class BaseUUIDModel(Base, TimestampMixin):
    """Abstract model class providing universal UUID primary key and timestamp mixins."""
    __abstract__ = True

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )
