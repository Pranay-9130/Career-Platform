from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class AtsAnalysisRequest(BaseModel):
    resume_id: Optional[UUID] = Field(None, description="UUID of saved resume")
    resume_text: Optional[str] = Field(None, description="Raw text of candidate resume", max_length=50000)
    job_id: Optional[UUID] = Field(None, description="UUID of platform job listing")
    job_description: Optional[str] = Field(None, description="Target job description text", max_length=50000)

class BulletRewrite(BaseModel):
    original_text: str
    improved_text: str
    reason: str

class AtsBreakdown(BaseModel):
    skills_score: int = Field(ge=0, le=100)
    experience_score: int = Field(ge=0, le=100)
    education_score: int = Field(ge=0, le=100)
    formatting_score: int = Field(ge=0, le=100)

class AtsAnalysisResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    verdict: str
    summary: str
    breakdown: AtsBreakdown
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    critical_gaps: List[str] = Field(default_factory=list)
    bullet_recommendations: List[BulletRewrite] = Field(default_factory=list)
    analyzed_with: str = "rule-based-nlp-engine"
