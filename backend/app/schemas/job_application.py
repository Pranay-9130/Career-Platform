from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class JobApplicationBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    position_title: str = Field(..., min_length=1, max_length=200)
    job_location: Optional[str] = Field(default="Remote", max_length=150)
    work_mode: Optional[str] = Field(default="Remote", max_length=50)
    salary_or_stipend: Optional[str] = Field(default=None, max_length=100)
    job_url: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(
        default="Applied",
        pattern="^(Saved|Applied|Interviewing|Offer|Rejected)$",
        description="Application pipeline stage",
    )
    applied_date: Optional[datetime] = None
    next_interview_date: Optional[datetime] = None
    notes: Optional[str] = Field(default=None, max_length=5000)

class JobApplicationCreate(JobApplicationBase):
    job_id: Optional[UUID] = None

class JobApplicationUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    position_title: Optional[str] = Field(None, min_length=1, max_length=200)
    job_location: Optional[str] = None
    work_mode: Optional[str] = None
    salary_or_stipend: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(Saved|Applied|Interviewing|Offer|Rejected)$")
    applied_date: Optional[datetime] = None
    next_interview_date: Optional[datetime] = None
    notes: Optional[str] = None

class JobApplicationRead(JobApplicationBase):
    id: UUID
    user_id: UUID
    job_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobApplicationStats(BaseModel):
    total: int = 0
    saved: int = 0
    applied: int = 0
    interviewing: int = 0
    offer: int = 0
    rejected: int = 0
