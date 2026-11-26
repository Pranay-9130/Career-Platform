from datetime import datetime, timezone
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.profile import Profile
from app.models.career_discovery import StudentCareerDiscovery
from app.services.career_discovery_service import CareerDiscoveryService


router = APIRouter(prefix="/career-discovery", tags=["Career Discovery"])


class QuestionnaireSaveRequest(BaseModel):
    current_step: Optional[int] = None
    education_info: Optional[Dict[str, Any]] = None
    technical_interests: Optional[List[str]] = None
    skill_level: Optional[str] = None
    self_reported_skills: Optional[List[str]] = None
    career_goals: Optional[Dict[str, Any]] = None
    learning_preferences: Optional[Dict[str, Any]] = None


class AssessmentSubmitRequest(BaseModel):
    answers: Dict[str, str]


class RoadmapUpdateRequest(BaseModel):
    stage_id: int
    status: str  # 'pending', 'in_progress', 'completed'


@router.get("", response_model=Dict[str, Any])
async def get_career_discovery_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the student's current Career Discovery status, questionnaire progress,
    assessment state, and roadmap (pre-filling education/skills from profile if not yet started).
    """
    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)
    result = discovery.to_dict()

    # If education_info is empty, attempt to pre-fill from user profile
    if not result.get("education_info") or not result["education_info"].get("college_name"):
        profile_stmt = select(Profile).where(Profile.user_id == current_user.id)
        profile = (await db.scalars(profile_stmt)).first()
        if profile:
            result["education_info"] = {
                "college_name": profile.university or "",
                "degree": profile.degree or "",
                "branch": "",
                "current_year": "3rd Year",
                "graduation_year": profile.graduation_year or 2026,
            }

    return result


@router.post("/save-progress", response_model=Dict[str, Any])
async def save_discovery_progress(
    payload: QuestionnaireSaveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Saves partial or completed questionnaire steps (1-5).
    """
    discovery = await CareerDiscoveryService.save_questionnaire_progress(
        db=db,
        user_id=current_user.id,
        data=payload.model_dump(exclude_unset=True),
    )
    return discovery.to_dict()


@router.post("/generate-assessment", response_model=Dict[str, Any])
async def generate_assessment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates 5-7 indicative assessment questions tailored to the student's
    selected technical domains and declared skill level.
    """
    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)

    interests = discovery.technical_interests or []
    skill_level = discovery.skill_level or "beginner"

    questions = CareerDiscoveryService.generate_assessment_questions(interests, skill_level)

    discovery.assessment_questions = questions
    discovery.status = "assessment_ready"
    discovery.current_step = 6  # Step 6 represents the interactive assessment
    await db.commit()
    await db.refresh(discovery)

    return {
        "status": discovery.status,
        "questions": questions,
        "total_questions": len(questions),
        "disclaimer": "This is an indicative diagnostic assessment for personalized career guidance, not an official certification.",
    }


@router.post("/submit-assessment", response_model=Dict[str, Any])
async def submit_assessment(
    payload: AssessmentSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits student's answers, evaluates competency, generates recommendations,
    and produces a 7-stage actionable career roadmap.
    """
    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)

    questions = discovery.assessment_questions or []
    if not questions:
        # If questions weren't stored, generate a fresh batch to evaluate
        questions = CareerDiscoveryService.generate_assessment_questions(
            discovery.technical_interests or [],
            discovery.skill_level or "beginner"
        )
        discovery.assessment_questions = questions

    # Evaluate answers
    eval_result = CareerDiscoveryService.evaluate_assessment(questions, payload.answers)

    discovery.assessment_answers = payload.answers
    discovery.assessment_score = eval_result["score"]
    discovery.assessment_total = eval_result["total"]
    discovery.assessment_result = eval_result

    try:
        # Generate recommendations using real DB items
        recommendations = await CareerDiscoveryService.generate_recommendations(
            discovery_data=discovery.to_dict(),
            db=db,
        )

        discovery.recommendations = recommendations
        discovery.roadmap_progress = recommendations.get("roadmap", [])
        discovery.status = "completed"
        discovery.completed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(discovery)

        return discovery.to_dict()
    except Exception as e:
        await db.rollback()
        logging.getLogger("uvicorn.error").error("submit_assessment failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate your career roadmap: {str(e)}"
        )


@router.post("/update-roadmap", response_model=Dict[str, Any])
async def update_roadmap_stage(
    payload: RoadmapUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Updates the completion status of a stage in the 7-stage career roadmap.
    """
    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)
    roadmap = list(discovery.roadmap_progress or [])

    updated = False
    for item in roadmap:
        if item.get("stage_id") == payload.stage_id:
            item["status"] = payload.status
            updated = True
            break

    if updated:
        discovery.roadmap_progress = roadmap
        await db.commit()
        await db.refresh(discovery)

    return {"status": "success", "roadmap": discovery.roadmap_progress}


@router.post("/reset", response_model=Dict[str, Any])
async def reset_career_discovery(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Resets the discovery process so the student can re-take the questionnaire and assessment.
    """
    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)
    discovery.status = "not_started"
    discovery.current_step = 1
    discovery.assessment_questions = None
    discovery.assessment_answers = None
    discovery.assessment_score = None
    discovery.assessment_total = None
    discovery.assessment_result = None
    discovery.recommendations = None
    discovery.roadmap_progress = None
    discovery.completed_at = None

    await db.commit()
    await db.refresh(discovery)
    return discovery.to_dict()


@router.get("/summary", response_model=Dict[str, Any])
async def get_career_discovery_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Lightweight summary for student dashboard:
    - Whether discovery is completed
    - Primary recommended career role
    - Match percentage
    - Next roadmap action
    - Count of matched verified job opportunities
    """
    # Admins do not receive student discovery summary
    if current_user.role == "ADMIN":
        return {"show_card": False}

    discovery = await CareerDiscoveryService.get_or_create_discovery(db, current_user.id)

    if discovery.status != "completed":
        return {
            "show_card": True,
            "is_completed": False,
            "status": discovery.status,
            "current_step": discovery.current_step,
        }

    recs = discovery.recommendations or {}
    primary_role = recs.get("primary_role") or {}
    roadmap = discovery.roadmap_progress or []
    next_stage = next((s for s in roadmap if s.get("status") != "completed"), None)
    matched_jobs = recs.get("matched_jobs") or []

    return {
        "show_card": True,
        "is_completed": True,
        "primary_role": primary_role.get("role_name", "Software Engineer"),
        "match_percentage": primary_role.get("match_percentage", 85),
        "missing_skills": primary_role.get("missing_skills", [])[:3],
        "next_stage": next_stage,
        "matched_jobs_count": len(matched_jobs),
        "completed_at": discovery.completed_at.isoformat() if discovery.completed_at else None,
    }
