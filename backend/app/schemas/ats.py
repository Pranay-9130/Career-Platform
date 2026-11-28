from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class AtsAnalysisRequest(BaseModel):
    resume_id: Optional[UUID] = Field(None, description="UUID of saved resume")
    resume_text: Optional[str] = Field(None, description="Raw text of candidate resume", max_length=50000)
    job_id: Optional[UUID] = Field(None, description="UUID of platform job listing")
    job_description: Optional[str] = Field(None, description="Target job description text", max_length=50000)
    analysis_mode: str = Field("job_match", description="Analysis mode: 'health_check' (no JD needed) or 'job_match'")

class BulletRewrite(BaseModel):
    original_text: str
    improved_text: str
    reason: str

class AtsBreakdown(BaseModel):
    skills_score: int = Field(ge=0, le=100)
    experience_score: int = Field(ge=0, le=100)
    education_score: int = Field(ge=0, le=100)
    formatting_score: int = Field(ge=0, le=100)

class SectionFeedbackItem(BaseModel):
    section_name: str
    score: int = Field(ge=0, le=100)
    status: str = Field("Needs Improvement", description="'Strong', 'Needs Improvement', or 'Missing'")
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class ResumeHealthCheckData(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    ats_compatibility_score: int = Field(ge=0, le=100)
    content_quality_score: int = Field(ge=0, le=100)
    verdict: str
    summary: str
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    missing_sections: List[str] = Field(default_factory=list)
    section_feedback: List[SectionFeedbackItem] = Field(default_factory=list)
    actionable_recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "This Resume Health Check provides general readability and structural feedback. "
        "It does not evaluate job-specific fit or guarantee interview shortlists at any specific employer."
    )

class AtsAnalysisResponse(BaseModel):
    analysis_mode: str = "job_match"
    overall_score: int = Field(ge=0, le=100)
    verdict: str
    summary: str
    breakdown: Optional[AtsBreakdown] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    critical_gaps: List[str] = Field(default_factory=list)
    bullet_recommendations: List[BulletRewrite] = Field(default_factory=list)
    analyzed_with: str = "rule-based-nlp-engine"
    health_check: Optional[ResumeHealthCheckData] = None

class ResumeExtractTextResponse(BaseModel):
    filename: str
    file_size: int
    extracted_text: str
    preview: str
    character_count: int
    word_count: int
