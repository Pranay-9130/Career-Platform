from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TopicBase(BaseModel):
    name: str = Field(..., max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    display_order: int = 0


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    display_order: Optional[int] = None


class TopicRead(TopicBase):
    id: UUID
    role_id: UUID
    slug: str
    material_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    name: str = Field(..., max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    icon_name: str = "Terminal"
    is_active: bool = True
    display_order: int = 0


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    slug: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class RoleRead(RoleBase):
    id: UUID
    slug: str
    material_count: int = 0
    topics: List[TopicRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    is_published: bool = True


class MaterialCreate(MaterialBase):
    role_id: UUID
    topic_id: Optional[UUID] = None


class MaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    topic_id: Optional[UUID] = None
    is_published: Optional[bool] = None


class MaterialRead(MaterialBase):
    id: UUID
    role_id: UUID
    role_name: Optional[str] = None
    role_slug: Optional[str] = None
    topic_id: Optional[UUID] = None
    topic_name: Optional[str] = None
    file_name: str
    file_size_bytes: int
    file_size_formatted: Optional[str] = None
    page_count: int = 1
    download_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

