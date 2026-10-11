from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict, Field

class ProfileBase(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Unique public username slug (alphanumeric, dashes, underscores)",
    )
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    university: Optional[str] = Field(None, max_length=200)
    degree: Optional[str] = Field(None, max_length=100)
    graduation_year: Optional[int] = Field(None, ge=1970, le=2035)
    github_url: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    skills: List[str] = Field(default_factory=list)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
    )
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = Field(None, max_length=2000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    university: Optional[str] = Field(None, max_length=200)
    degree: Optional[str] = Field(None, max_length=100)
    graduation_year: Optional[int] = Field(None, ge=1970, le=2035)
    github_url: Optional[str] = Field(None, max_length=255)
    linkedin_url: Optional[str] = Field(None, max_length=255)
    portfolio_url: Optional[str] = Field(None, max_length=255)
    skills: Optional[List[str]] = None

class ProfileRead(ProfileBase):
    id: UUID
    user_id: UUID
    email: EmailStr
    full_name: str
    is_verified: bool = False
    completion_percentage: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublicProjectPreview(BaseModel):
    id: Optional[UUID] = None
    slug: Optional[str] = None
    title: str
    description: str
    domain: Optional[str] = None
    difficulty: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    is_featured: bool = False
    role: str = "Author"
    views_count: int = 0
    stars_count: int = 0

class PublicProfileRead(BaseModel):
    username: str
    full_name: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    is_verified: bool = False
    projects_count: int = 0
    total_stars_count: int = 0
    total_views_count: int = 0
    projects: List[PublicProjectPreview] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
