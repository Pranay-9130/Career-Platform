from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    company_name: str = Field(..., min_length=2, max_length=200)
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    domain: str = Field(default="Software Engineering", max_length=100)
    job_type: str = Field(default="Full-time", max_length=50)  # Full-time, Internship, Contract
    work_mode: str = Field(default="Remote", max_length=50)    # Remote, Hybrid, Onsite
    location: str = Field(default="Remote", max_length=150)
    stipend_or_salary: str = Field(default="Competitive", max_length=100)
    experience_level: str = Field(default="Entry Level", max_length=50)  # Internship, Entry Level, Mid-Level
    skills_required: List[str] = Field(default_factory=list)
    description: str = Field(default="", max_length=10000)
    responsibilities: List[str] = Field(default_factory=list)
    requirements: List[str] = Field(default_factory=list)
    apply_url: str = Field(..., max_length=500)
    is_active: bool = True
    is_featured: bool = False
    deadline: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    company_name: Optional[str] = Field(None, min_length=2, max_length=200)
    company_logo_url: Optional[str] = None
    company_website: Optional[str] = None
    domain: Optional[str] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    experience_level: Optional[str] = None
    skills_required: Optional[List[str]] = None
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    apply_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    deadline: Optional[datetime] = None

class JobBookmarkToggleResponse(BaseModel):
    job_id: UUID
    bookmarked: bool
    message: str

class JobRead(JobBase):
    id: UUID
    is_bookmarked: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobFacetItem(BaseModel):
    name: str
    count: int

class JobFacets(BaseModel):
    domains: List[JobFacetItem] = Field(default_factory=list)
    job_types: List[JobFacetItem] = Field(default_factory=list)
    work_modes: List[JobFacetItem] = Field(default_factory=list)
    experience_levels: List[JobFacetItem] = Field(default_factory=list)

class JobListResponse(BaseModel):
    items: List[JobRead]
    total: int
    page: int
    limit: int
    total_pages: int
    facets: Optional[JobFacets] = None
