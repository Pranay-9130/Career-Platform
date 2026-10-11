from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    type: str = Field(default="INFO", max_length=50)  # INFO, SUCCESS, WARNING, MODERATION, APPLICATION
    link_url: Optional[str] = Field(default=None, max_length=500)

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationRead(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UnreadCountResponse(BaseModel):
    unread_count: int
