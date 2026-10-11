from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    domain: str = Field(..., max_length=100)
    short_description: str = Field(..., min_length=10, max_length=300)
    difficulty: str = Field(default="Intermediate", max_length=30)
    estimated_duration: Optional[str] = Field(default="2-3 weeks", max_length=50)
    tech_stack: List[str] = Field(default_factory=list)
    cover_image_url: Optional[str] = None
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    video_demo_url: Optional[str] = None

class ProjectRead(ProjectBase):
    id: UUID
    slug: str
    owner_id: UUID
    author_name: str
    author_avatar: Optional[str] = None
    author_username: Optional[str] = None
    status: str
    reviewer_notes: Optional[str] = None
    views_count: int = 0
    stars_count: int = 0
    bookmarks_count: int = 0
    is_bookmarked: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BookmarkToggleResponse(BaseModel):
    project_id: UUID
    bookmarked: bool
    bookmarks_count: int
    message: str

class ScreenshotItem(BaseModel):
    id: Optional[UUID] = None
    image_url: str
    caption: Optional[str] = None
    order_index: int = 0

class ContributorItem(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    role: Optional[str] = Field(default="Contributor", max_length=100)
    github_username: Optional[str] = None
    profile_username: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None

class ProjectCreate(ProjectBase):
    problem_statement: str = Field(default="", max_length=5000)
    objectives: Optional[str] = Field(default=None, max_length=2000)
    features: List[str] = Field(default_factory=list)
    prerequisites: Optional[str] = Field(default=None, max_length=2000)
    expected_outcome: Optional[str] = Field(default=None, max_length=2000)
    screenshots: List[ScreenshotItem] = Field(default_factory=list)
    contributors: List[ContributorItem] = Field(default_factory=list)
    zip_storage_key: Optional[str] = None
    zip_file_size_bytes: int = 0
    status: str = Field(default="Submitted", pattern="^(Draft|Submitted)$")

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    domain: Optional[str] = None
    short_description: Optional[str] = Field(None, min_length=10, max_length=300)
    difficulty: Optional[str] = None
    estimated_duration: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    features: Optional[List[str]] = None
    prerequisites: Optional[str] = None
    expected_outcome: Optional[str] = None
    cover_image_url: Optional[str] = None
    screenshots: Optional[List[ScreenshotItem]] = None
    contributors: Optional[List[ContributorItem]] = None
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None
    video_demo_url: Optional[str] = None
    zip_storage_key: Optional[str] = None
    zip_file_size_bytes: Optional[int] = None
    reviewer_notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(Draft|Submitted)$")

class ProjectDetailRead(ProjectRead):
    problem_statement: str
    objectives: Optional[str] = None
    features: List[str] = Field(default_factory=list)
    prerequisites: Optional[str] = None
    expected_outcome: Optional[str] = None
    screenshots: List[ScreenshotItem] = Field(default_factory=list)
    contributors: List[ContributorItem] = Field(default_factory=list)
    author_headline: Optional[str] = None
    author_bio: Optional[str] = None
    author_university: Optional[str] = None
    author_github: Optional[str] = None
    author_linkedin: Optional[str] = None
    author_portfolio: Optional[str] = None
    zip_download_url: Optional[str] = None
    zip_file_size_bytes: int = 0

    model_config = ConfigDict(from_attributes=True)

class FacetItem(BaseModel):
    name: str
    count: int

class ProjectFacets(BaseModel):
    domains: List[FacetItem] = Field(default_factory=list)
    difficulties: List[FacetItem] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)

class ProjectListResponse(BaseModel):
    items: List[ProjectRead]
    total: int
    page: int
    limit: int
    total_pages: int
    facets: Optional[ProjectFacets] = None
