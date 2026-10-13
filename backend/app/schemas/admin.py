import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ProjectModerationAction(BaseModel):
    action: str = Field(
        ...,
        pattern="^(approve|reject|request_changes)$",
        description="Moderation decision: approve, reject, or request_changes",
    )
    reviewer_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional administrator feedback or revision instructions for the student",
    )

class AdminStats(BaseModel):
    pending_submissions: int = 0
    published_projects: int = 0
    total_students: int = 0
    total_jobs: int = 0
    flagged_reports: int = 0

class StudentAdminRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    headline: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: List[str] = []
    username: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime
    projects_count: int = 0

class ResumeTemplateCreate(BaseModel):
    id: Optional[str] = Field(None, max_length=50)
    name: str = Field(..., max_length=100)
    tagline: Optional[str] = Field("", max_length=250)
    description: str = Field(..., max_length=1000)
    badge: Optional[str] = Field("Professional", max_length=50)
    ats_score: Optional[str] = Field("95/100", max_length=20)
    best_for: Optional[str] = Field("General Engineering", max_length=150)
    preview_accent: Optional[str] = Field("#F97316", max_length=20)
    preview_image_url: Optional[str] = Field(None)
    download_url: Optional[str] = Field(None)
    is_active: bool = Field(True)

class ResumeTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    tagline: Optional[str] = Field(None, max_length=250)
    description: Optional[str] = Field(None, max_length=1000)
    badge: Optional[str] = Field(None, max_length=50)
    ats_score: Optional[str] = Field(None, max_length=20)
    best_for: Optional[str] = Field(None, max_length=150)
    preview_accent: Optional[str] = Field(None, max_length=20)
    preview_image_url: Optional[str] = Field(None)
    download_url: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)

class ResumeTemplateRead(ResumeTemplateCreate):
    is_custom: bool = True
