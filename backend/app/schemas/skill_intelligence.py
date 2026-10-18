from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.skill_intelligence import SkillStatus, SkillSource


class TargetRolePreferenceRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=120)
    experience_level: str = Field(default="Student / Entry Level", max_length=50)
    preferences: Dict[str, Any] = Field(default_factory=dict)


class TargetRolePreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    target_role: str
    experience_level: str
    preferences: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StudentSkillCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="Technical Skills", max_length=60)
    source: str = Field(default=SkillSource.MANUAL.value)
    status: str = Field(default=SkillStatus.NOT_STARTED.value)
    notes: Optional[str] = None
    is_confirmed: bool = True

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = [s.value for s in SkillStatus]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        valid_sources = [s.value for s in SkillSource]
        if v not in valid_sources:
            raise ValueError(f"Source must be one of: {', '.join(valid_sources)}")
        return v


class StudentSkillBatchCreate(BaseModel):
    skills: List[StudentSkillCreate]


class StudentSkillUpdate(BaseModel):
    skill_name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=60)
    status: Optional[str] = None
    notes: Optional[str] = None
    is_confirmed: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_statuses = [s.value for s in SkillStatus]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v


class StudentSkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    skill_name: str
    category: str
    source: str
    is_confirmed: bool
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ExtractedSkillItem(BaseModel):
    skill_name: str
    category: str
    source: str = "resume"
    already_confirmed: bool = False
    current_status: Optional[str] = None


class SkillExtractionRequest(BaseModel):
    resume_id: Optional[uuid.UUID] = None
    resume_text: Optional[str] = None


class SuggestedRoleItem(BaseModel):
    role_title: str
    domain: str
    match_percentage: float
    matched_skills_count: int
    total_role_skills: int
    matched_skills: List[str] = Field(default_factory=list)
    missing_essential_skills: List[str] = Field(default_factory=list)
    fit_level: str = "Moderate Fit"
    is_recommended: bool = False
    why_recommended: str = ""


class SkillExtractionResponse(BaseModel):
    total_extracted: int
    skills: List[ExtractedSkillItem]
    source_type: str
    suggested_roles: List[SuggestedRoleItem] = Field(default_factory=list)


class RoleSuggestionRequest(BaseModel):
    skills: Optional[List[str]] = None


class RoleSuggestionResponse(BaseModel):
    total_suggested: int
    suggested_roles: List[SuggestedRoleItem]


class SkillGapItem(BaseModel):
    name: str
    category: str
    is_essential: bool
    why_it_matters: str
    prerequisites: List[str] = Field(default_factory=list)
    current_status: Optional[str] = None
    evidence_status: Optional[str] = "Demonstrated"
    weight: int = 10
    job_frequency_percentage: Optional[float] = None
    learning_order: int = 1


class SkillGapAnalysisResponse(BaseModel):
    target_role: str
    experience_level: str
    total_role_skills: int
    matched_skills_count: int
    missing_skills_count: int
    coverage_percentage: float
    essential_coverage_percentage: float
    previous_coverage_percentage: Optional[float] = None
    last_reassessed_at: Optional[datetime] = None
    matched_skills: List[SkillGapItem]
    missing_skills: List[SkillGapItem]
    data_sources_used: List[str]
    evaluation_formula: str = (
        "Role Match (%) = (Sum of weights for matched evaluated requirements / Sum of weights for evaluated requirements) × 100"
    )
    disclaimer: str = (
        "Role match percentage reflects evaluated technical skills and does not represent a guarantee of employment."
    )


class LearningResource(BaseModel):
    title: str
    url: str
    resource_type: str = "Documentation"
    status: Optional[str] = "not_started"  # 'not_started' | 'started' | 'completed'


class ResourceProgressRequest(BaseModel):
    resource_url: str
    skill_name: str
    status: str = Field(..., description="'started' | 'completed' | 'not_started'")


class ResourceProgressResponse(BaseModel):
    resource_url: str
    skill_name: str
    status: str
    updated_at: datetime


class ReassessmentResponse(BaseModel):
    target_role: str
    previous_match_percentage: float
    current_match_percentage: float
    score_delta: float
    improved_skills: List[str]
    remaining_gaps: List[str]
    explanation: str
    career_readiness_impact: str
    reassessed_at: datetime


class RelatedProjectSummary(BaseModel):
    id: str
    title: str
    slug: str
    short_description: str
    difficulty: str
    tech_stack: List[str]
    teaches_skills: List[str]
    relevance_reason: str
    cover_image_url: Optional[str] = None


class SkillRecommendation(BaseModel):
    skill_name: str
    category: str
    current_status: str
    priority: str  # 'High' | 'Medium' | 'Low'
    priority_score: int  # 0 to 100
    reason: str
    relevance: str
    is_essential: bool
    prerequisites: List[str] = Field(default_factory=list)
    estimated_duration: str
    learning_stage: int
    learning_objectives: List[str] = Field(default_factory=list)
    resources: List[LearningResource] = Field(default_factory=list)
    practice_exercise: Optional[str] = None
    related_project: Optional[RelatedProjectSummary] = None


class RecommendationsResponse(BaseModel):
    target_role: str
    total_recommendations: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    items: List[SkillRecommendation]
    scoring_weights_explanation: Dict[str, Any]


class RoadmapStage(BaseModel):
    stage_number: int
    stage_title: str
    stage_description: str
    skills: List[SkillRecommendation]
    completed_count: int
    total_count: int
    estimated_stage_duration: str


class RoadmapResponse(BaseModel):
    target_role: str
    stages: List[RoadmapStage]
    overall_completed_count: int
    overall_total_skills: int
    overall_progress_percentage: float


class DashboardSkillSummaryResponse(BaseModel):
    has_target_role: bool
    target_role: Optional[str] = None
    experience_level: Optional[str] = None
    recommended_skills_count: int
    top_recommendations: List[SkillRecommendation]
    progress_summary: Dict[str, int]
    completion_percentage: float
    has_skills_confirmed: bool


class AIAdviceRequest(BaseModel):
    custom_question: Optional[str] = None


class AIAdviceResponse(BaseModel):
    advice: str
    source: str
    target_role: str


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., min_length=1, max_length=3000)


class MentorChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1)
    session_id: Optional[str] = None


class MentorChatResponse(BaseModel):
    reply: str
    source: str
    target_role: str
    suggested_followups: List[str] = []

