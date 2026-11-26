from datetime import datetime
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Feature announcement headline")
    description: str = Field(..., min_length=5, description="Clear, concise description of the new feature")
    icon_or_image: Optional[str] = Field(None, max_length=500, description="Lucide icon name or image URL")
    link_url: Optional[str] = Field(None, max_length=255, description="Relative destination route (e.g. /career-discovery)")
    link_label: str = Field("Explore Feature", max_length=100)
    status: Literal["DRAFT", "PUBLISHED"] = "PUBLISHED"


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    icon_or_image: Optional[str] = Field(None, max_length=500)
    link_url: Optional[str] = Field(None, max_length=255)
    link_label: Optional[str] = Field(None, max_length=100)
    status: Optional[Literal["DRAFT", "PUBLISHED"]] = None


class AnnouncementRead(AnnouncementBase):
    id: UUID
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_status: Optional[str] = None  # 'SEEN', 'DISMISSED', 'DEFERRED', or 'UNSEEN'

    model_config = ConfigDict(from_attributes=True)


class AnnouncementTrackRequest(BaseModel):
    status: Literal["SEEN", "DISMISSED", "DEFERRED"]


class ActiveAnnouncementsResponse(BaseModel):
    announcements: List[AnnouncementRead]
    unread_count: int
    pending_popup_announcements: List[AnnouncementRead]
