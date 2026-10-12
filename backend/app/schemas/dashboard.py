from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserRead

class DashboardStats(BaseModel):
    projects_count: int = 0
    projects_draft: int = 0
    projects_under_review: int = 0
    projects_published: int = 0
    resume_completion_percentage: int = 0
    ats_score: Optional[int] = None
    active_applications_count: int = 0
    applications_applied: int = 0
    interviews_scheduled_count: int = 0
    applications_offer: int = 0
    applications_rejected: int = 0
    saved_items_count: int = 0
    saved_jobs_count: int = 0
    unread_notifications_count: int = 0

class DashboardActivity(BaseModel):
    id: str
    action: str
    title: str
    timestamp: datetime
    category: str  # 'account' | 'project' | 'resume' | 'application'
    link: Optional[str] = None

class DashboardRecommendation(BaseModel):
    id: str
    title: str
    organization: str
    category: str  # 'project' | 'job'
    domain: str
    tag: str
    location: str
    link: str

class DashboardRecentApplication(BaseModel):
    id: str
    company_name: str
    position_title: str
    status: str
    applied_date: datetime
    job_location: Optional[str] = "Remote"
    work_mode: Optional[str] = "Remote"
    salary_or_stipend: Optional[str] = None

class DashboardSummaryResponse(BaseModel):
    user: UserRead
    stats: DashboardStats
    recent_activity: List[DashboardActivity]
    recommended_opportunities: List[DashboardRecommendation]
    recent_applications: List[DashboardRecentApplication] = []
    has_resume: bool = False
    latest_resume_title: Optional[str] = None
    readiness_score: int = 55
    readiness_stage: str = "Stage 2: Skill Builder"
    next_milestone: str = "Showcase your first practical project to reach Stage 3: Verified Creator"
