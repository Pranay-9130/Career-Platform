import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy import select, func, desc, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user
from app.core.rate_limiter import ai_rate_limiter, general_rate_limiter
from app.models.user import User
from app.models.resume import Resume
from app.models.project import Project
from app.models.skill_intelligence import (
    StudentTargetRole,
    StudentSkill,
    SkillStatus,
    SkillSource,
)
from app.schemas.skill_intelligence import (
    TargetRolePreferenceRequest,
    TargetRolePreferenceResponse,
    StudentSkillCreate,
    StudentSkillBatchCreate,
    StudentSkillUpdate,
    StudentSkillRead,
    SkillExtractionRequest,
    SkillExtractionResponse,
    ExtractedSkillItem,
    SuggestedRoleItem,
    RoleSuggestionRequest,
    RoleSuggestionResponse,
    SkillGapAnalysisResponse,
    RecommendationsResponse,
    RoadmapResponse,
    DashboardSkillSummaryResponse,
    RelatedProjectSummary,
    AIAdviceRequest,
    AIAdviceResponse,
    ChatMessage,
    MentorChatRequest,
    MentorChatResponse,
    ReassessmentResponse,
    ResourceProgressRequest,
    ResourceProgressResponse,
)
from app.services.skill_intelligence import (
    CURATED_ROLES,
    normalize_skill_name,
    extract_text_from_pdf,
    extract_skills_from_text,
    calculate_suggested_roles_for_skills,
    analyze_role_skill_gap,
    generate_skill_recommendations,
    generate_learning_roadmap,
    get_dashboard_skill_summary,
    generate_ai_skill_advice,
    chat_with_ai_mentor,
    reassess_student_career_fit,
    update_resource_progress,
)
from app.services.ats_analyzer import extract_resume_text_from_dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skill-intelligence", tags=["Skill Intelligence"])


# ==============================================================================
# 1. TARGET ROLE SELECTION & CATALOG
# ==============================================================================

@router.get("/roles", response_model=List[Dict[str, Any]])
async def list_target_roles():
    """
    Returns the supported career roles catalog, domain affiliations, and descriptions.
    """
    roles_list = []
    for title, data in CURATED_ROLES.items():
        roles_list.append({
            "title": title,
            "domain": data.get("domain", "Software Engineering"),
            "description": data.get("description", ""),
            "total_curated_skills": len(data.get("skills", [])),
        })
    return roles_list


@router.get("/target-role", response_model=Optional[TargetRolePreferenceResponse])
async def get_target_role_preference(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve the authenticated student's saved target role and career preferences.
    """
    stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
    pref = (await db.scalars(stmt)).first()
    if not pref:
        return None
    return TargetRolePreferenceResponse.model_validate(pref)


@router.put("/target-role", response_model=TargetRolePreferenceResponse)
async def set_target_role_preference(
    payload: TargetRolePreferenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Save or update target role preference and career aspirations.
    """
    stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
    pref = (await db.scalars(stmt)).first()

    if pref:
        pref.target_role = payload.target_role.strip()
        pref.experience_level = payload.experience_level.strip()
        pref.preferences = payload.preferences
    else:
        pref = StudentTargetRole(
            user_id=current_user.id,
            target_role=payload.target_role.strip(),
            experience_level=payload.experience_level.strip(),
            preferences=payload.preferences,
        )
        db.add(pref)

    await db.commit()
    await db.refresh(pref)
    return TargetRolePreferenceResponse.model_validate(pref)


# ==============================================================================
# 2. CONFIRMED SKILLS MANAGEMENT
# ==============================================================================

@router.get("/skills", response_model=List[StudentSkillRead])
async def list_student_skills(
    status_filter: Optional[str] = Query(None, alias="status"),
    source_filter: Optional[str] = Query(None, alias="source"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all confirmed and extracted skills for the authenticated student.
    """
    stmt = select(StudentSkill).where(StudentSkill.user_id == current_user.id)
    if status_filter:
        stmt = stmt.where(StudentSkill.status == status_filter)
    if source_filter:
        stmt = stmt.where(StudentSkill.source == source_filter)

    stmt = stmt.order_by(desc(StudentSkill.updated_at))
    skills = (await db.scalars(stmt)).all()
    return [StudentSkillRead.model_validate(s) for s in skills]


@router.post("/skills", response_model=List[StudentSkillRead], status_code=status.HTTP_201_CREATED)
async def add_student_skills(
    payload: StudentSkillBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add or confirm skills for the authenticated student.
    Avoids duplicate skills through case-insensitive normalization.
    """
    created_or_updated = []

    for item in payload.skills:
        c_name, c_cat = normalize_skill_name(item.skill_name)
        norm_name = c_name.strip().lower()

        stmt = select(StudentSkill).where(
            StudentSkill.user_id == current_user.id,
            StudentSkill.normalized_name == norm_name,
        )
        existing = (await db.scalars(stmt)).first()

        if existing:
            # Update existing record
            existing.skill_name = c_name
            existing.category = item.category if item.category != "Technical Skills" else c_cat
            if item.status:
                existing.status = item.status
            existing.is_confirmed = item.is_confirmed
            if item.notes is not None:
                existing.notes = item.notes
            created_or_updated.append(existing)
        else:
            new_skill = StudentSkill(
                user_id=current_user.id,
                skill_name=c_name,
                normalized_name=norm_name,
                category=item.category if item.category != "Technical Skills" else c_cat,
                source=item.source,
                is_confirmed=item.is_confirmed,
                status=item.status,
                notes=item.notes,
            )
            db.add(new_skill)
            created_or_updated.append(new_skill)

    await db.commit()
    for s in created_or_updated:
        await db.refresh(s)

    return [StudentSkillRead.model_validate(s) for s in created_or_updated]


@router.put("/skills/{skill_id}", response_model=StudentSkillRead)
async def update_student_skill(
    skill_id: uuid.UUID,
    payload: StudentSkillUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a skill's progress status, category, notes, or confirmation.
    Strictly isolated to records owned by the authenticated student.
    """
    stmt = select(StudentSkill).where(
        StudentSkill.id == skill_id,
        StudentSkill.user_id == current_user.id,
    )
    skill = (await db.scalars(stmt)).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill record was not found or access denied.",
        )

    if payload.skill_name is not None:
        c_name, c_cat = normalize_skill_name(payload.skill_name)
        skill.skill_name = c_name
        skill.normalized_name = c_name.strip().lower()
        if payload.category is None:
            skill.category = c_cat

    if payload.category is not None:
        skill.category = payload.category.strip()

    if payload.status is not None:
        skill.status = payload.status

    if payload.notes is not None:
        skill.notes = payload.notes

    if payload.is_confirmed is not None:
        skill.is_confirmed = payload.is_confirmed

    await db.commit()
    await db.refresh(skill)
    return StudentSkillRead.model_validate(skill)


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove a skill from the student's workspace.
    """
    stmt = select(StudentSkill).where(
        StudentSkill.id == skill_id,
        StudentSkill.user_id == current_user.id,
    )
    skill = (await db.scalars(stmt)).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill record was not found or access denied.",
        )

    await db.delete(skill)
    await db.commit()
    return None


# ==============================================================================
# 3. RESUME-BASED SKILL EXTRACTION
# ==============================================================================

@router.post("/extract-skills", response_model=SkillExtractionResponse)
async def extract_skills(
    payload: SkillExtractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Extract skills from an existing saved resume in the student's account or raw resume text.
    Identifies technical skills, tools, languages, frameworks, databases, and soft skills.
    Cross-references against existing confirmed skills so students know what is already confirmed.
    """
    text_to_analyze = ""
    source_type = "raw_text"

    if payload.resume_id:
        stmt = select(Resume).where(
            Resume.id == payload.resume_id,
            Resume.user_id == current_user.id,
        )
        resume = (await db.scalars(stmt)).first()
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The specified resume was not found in your account.",
            )
        resume_dict = {
            "title": resume.title,
            "personal_info": resume.personal_info or {},
            "summary": resume.summary or "",
            "education": resume.education or [],
            "experience": resume.experience or [],
            "projects": resume.projects or [],
            "skills": resume.skills or [],
            "certifications": resume.certifications or [],
        }
        text_to_analyze = extract_resume_text_from_dict(resume_dict)
        source_type = "saved_resume"
    elif payload.resume_text and payload.resume_text.strip():
        text_to_analyze = payload.resume_text.strip()
        source_type = "raw_text"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'resume_id' or non-empty 'resume_text' must be provided.",
        )

    extracted_raw = extract_skills_from_text(text_to_analyze)

    # Check against user's already confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == current_user.id)
    user_skills = (await db.scalars(stmt_skills)).all()
    user_skill_map = {s.normalized_name: s for s in user_skills}

    items = []
    for item in extracted_raw:
        c_name = item["skill_name"]
        norm = c_name.strip().lower()
        existing = user_skill_map.get(norm)
        items.append(
            ExtractedSkillItem(
                skill_name=c_name,
                category=item["category"],
                source="resume",
                already_confirmed=existing is not None and existing.is_confirmed,
                current_status=existing.status if existing else None,
            )
        )

    # Automatically suggest roles student fits according to extracted skills
    skill_names = [it.skill_name for it in items]
    suggested_raw = calculate_suggested_roles_for_skills(skill_names)
    suggested_roles = [SuggestedRoleItem(**r) for r in suggested_raw]

    return SkillExtractionResponse(
        total_extracted=len(items),
        skills=items,
        source_type=source_type,
        suggested_roles=suggested_roles,
    )


@router.post("/extract-skills-from-pdf", response_model=SkillExtractionResponse)
async def extract_skills_from_pdf_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Accepts a PDF resume file upload, extracts selectable text using PyMuPDF / pdfplumber,
    and returns parsed, categorized skills for student review and confirmation.
    Handles malformed files, empty bytes, and non-PDF uploads gracefully.
    """
    fname = (file.filename or "").lower()
    ctype = (file.content_type or "").lower()
    if not fname.endswith(".pdf") and ctype not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid .pdf file.",
        )

    content = await file.read()
    file_size = len(content)
    logger.info(
        "PDF upload received for skill extraction: filename=%s, content_type=%s, bytes=%d, user_id=%s",
        file.filename,
        file.content_type,
        file_size,
        current_user.id,
    )

    if file_size > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 10 MB.",
        )

    try:
        pdf_text = extract_text_from_pdf(content)
    except ValueError as ve:
        logger.warning("PDF extraction user error: filename=%s, error=%s", file.filename, ve)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        logger.error("PDF extraction service error: filename=%s, error=%s", file.filename, re)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(re),
        )
    except Exception as exc:
        logger.exception("PDF extraction unexpected error: filename=%s, error=%s", file.filename, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF resume: {str(exc)}",
        )

    extracted_raw = extract_skills_from_text(pdf_text)
    logger.info(
        "PDF skill extraction complete: filename=%s, text_length=%d, extracted_skills_count=%d",
        file.filename,
        len(pdf_text),
        len(extracted_raw),
    )

    # Check against user's already confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == current_user.id)
    user_skills = (await db.scalars(stmt_skills)).all()
    user_skill_map = {s.normalized_name: s for s in user_skills}

    items = []
    for item in extracted_raw:
        c_name = item["skill_name"]
        norm = c_name.strip().lower()
        existing = user_skill_map.get(norm)
        items.append(
            ExtractedSkillItem(
                skill_name=c_name,
                category=item["category"],
                source="resume",
                already_confirmed=existing is not None and existing.is_confirmed,
                current_status=existing.status if existing else None,
            )
        )

    # Automatically suggest roles student fits according to extracted skills
    skill_names = [it.skill_name for it in items]
    suggested_raw = calculate_suggested_roles_for_skills(skill_names)
    suggested_roles = [SuggestedRoleItem(**r) for r in suggested_raw]

    return SkillExtractionResponse(
        total_extracted=len(items),
        skills=items,
        source_type="pdf_upload",
        suggested_roles=suggested_roles,
    )


@router.post("/suggest-roles", response_model=RoleSuggestionResponse)
async def suggest_roles_for_student(
    payload: Optional[RoleSuggestionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Evaluates which engineering roles the student best fits based on their extracted or confirmed skills.
    Returns ranked suggestions with match percentage, missing essential skills, and reasons.
    """
    skill_names = []
    if payload and payload.skills:
        skill_names = payload.skills
    else:
        # Fetch confirmed skills for user from database
        stmt_skills = select(StudentSkill).where(
            StudentSkill.user_id == current_user.id,
            StudentSkill.is_confirmed == True,
        )
        user_skills = (await db.scalars(stmt_skills)).all()
        skill_names = [s.skill_name for s in user_skills]

    suggested_raw = calculate_suggested_roles_for_skills(skill_names)
    suggested_items = [SuggestedRoleItem(**r) for r in suggested_raw]

    return RoleSuggestionResponse(
        total_suggested=len(suggested_items),
        suggested_roles=suggested_items,
    )


# ==============================================================================
# 4. SKILL GAP ANALYSIS
# ==============================================================================

@router.get("/gap-analysis", response_model=SkillGapAnalysisResponse)
async def get_skill_gap_analysis(
    target_role: Optional[str] = None,
    experience_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Compare authenticated student's confirmed skills against their target role requirements.
    Uses platform job market data as priority 1 and curated competency taxonomy as priority 2.
    """
    resolved_role = target_role
    resolved_level = experience_level or "Student / Entry Level"

    if not resolved_role:
        stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
        pref = (await db.scalars(stmt)).first()
        if pref:
            resolved_role = pref.target_role
            resolved_level = pref.experience_level
        else:
            resolved_role = "Frontend Developer"

    result = await analyze_role_skill_gap(db, current_user.id, resolved_role, resolved_level)
    return SkillGapAnalysisResponse.model_validate(result)


# ==============================================================================
# 5. PERSONALIZED SKILL RECOMMENDATIONS
# ==============================================================================

@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_skill_recommendations(
    target_role: Optional[str] = None,
    experience_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns personalized, prioritized skill recommendations with transparent scoring,
    learning duration, resources, and practical project links.
    """
    resolved_role = target_role
    resolved_level = experience_level or "Student / Entry Level"

    if not resolved_role:
        stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
        pref = (await db.scalars(stmt)).first()
        if pref:
            resolved_role = pref.target_role
            resolved_level = pref.experience_level
        else:
            resolved_role = "Frontend Developer"

    result = await generate_skill_recommendations(db, current_user.id, resolved_role, resolved_level)
    return RecommendationsResponse.model_validate(result)


# ==============================================================================
# 6. LEARNING ROADMAP
# ==============================================================================

@router.get("/roadmap", response_model=RoadmapResponse)
async def get_learning_roadmap(
    target_role: Optional[str] = None,
    experience_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates an ordered learning roadmap arranged into 4 logical stages with prerequisites,
    learning objectives, practice exercises, and persistent student progress tracking.
    """
    resolved_role = target_role
    resolved_level = experience_level or "Student / Entry Level"

    if not resolved_role:
        stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
        pref = (await db.scalars(stmt)).first()
        if pref:
            resolved_role = pref.target_role
            resolved_level = pref.experience_level
        else:
            resolved_role = "Frontend Developer"

    result = await generate_learning_roadmap(db, current_user.id, resolved_role, resolved_level)
    return RoadmapResponse.model_validate(result)


# ==============================================================================
# 7. DASHBOARD SUMMARY CARD
# ==============================================================================

@router.get("/dashboard-summary", response_model=DashboardSkillSummaryResponse)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns the real database metrics for the student dashboard Skill Intelligence card.
    """
    result = await get_dashboard_skill_summary(db, current_user.id)
    return DashboardSkillSummaryResponse.model_validate(result)


# ==============================================================================
# 8. PROJECT SUGGESTIONS
# ==============================================================================

@router.get("/project-suggestions", response_model=List[RelatedProjectSummary])
async def get_project_suggestions(
    target_role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns verified platform showcase projects from the Project Hub that develop
    skills required for the student's target role.
    """
    resolved_role = target_role
    if not resolved_role:
        stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
        pref = (await db.scalars(stmt)).first()
        resolved_role = pref.target_role if pref else "Frontend Developer"

    role_info = CURATED_ROLES.get(resolved_role) or CURATED_ROLES["Software Engineer"]
    role_skill_names = [s["name"].lower() for s in role_info.get("skills", [])]

    stmt = select(Project).where(Project.status == "Published").order_by(desc(Project.stars_count))
    projects = (await db.scalars(stmt)).all()

    matched_projects = []
    for p in projects:
        stack = [s.lower() for s in (p.tech_stack or [])]
        matched_skills = [
            s_name.title() for s_name in role_skill_names
            if s_name in stack or any(s_name in s for s in stack)
        ]
        if matched_skills:
            matched_projects.append(
                RelatedProjectSummary(
                    id=str(p.id),
                    title=p.title,
                    slug=p.slug,
                    short_description=p.short_description,
                    difficulty=p.difficulty,
                    tech_stack=p.tech_stack or [],
                    teaches_skills=matched_skills[:3],
                    relevance_reason=f"Develops verified competency in {', '.join(matched_skills[:2])} for {resolved_role}.",
                    cover_image_url=p.cover_image_url,
                )
            )

    return matched_projects


# ==============================================================================
# 9. OPTIONAL AI MENTOR ADVICE
# ==============================================================================

@router.post(
    "/ai-advice",
    response_model=AIAdviceResponse,
    dependencies=[Depends(ai_rate_limiter)],
)
async def get_ai_skill_advice(
    payload: AIAdviceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generates mentor advice using Google Gemini AI grounded in the student's actual gaps,
    with automatic graceful fallback to the structured rules engine.
    """
    stmt = select(StudentTargetRole).where(StudentTargetRole.user_id == current_user.id)
    pref = (await db.scalars(stmt)).first()
    target_role = pref.target_role if pref else "Software Engineer"
    experience_level = pref.experience_level if pref else "Student / Entry Level"

    # Confirmed skills
    stmt_skills = select(StudentSkill).where(StudentSkill.user_id == current_user.id, StudentSkill.is_confirmed == True)
    skills = (await db.scalars(stmt_skills)).all()
    confirmed_names = [s.skill_name for s in skills]

    # Gap analysis for missing skills
    gap = await analyze_role_skill_gap(db, current_user.id, target_role, experience_level)
    missing_names = [item["name"] for item in gap["missing_skills"]]

    result = await generate_ai_skill_advice(
        target_role=target_role,
        experience_level=experience_level,
        confirmed_skills=confirmed_names,
        missing_skills=missing_names,
        custom_question=payload.custom_question,
    )
    return AIAdviceResponse.model_validate(result)


@router.post(
    "/mentor-chat",
    response_model=MentorChatResponse,
    dependencies=[Depends(ai_rate_limiter)],
    summary="Conversational chat with AI Career Mentor",
)
async def chat_with_mentor(
    payload: MentorChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Multi-turn conversational chat with CareerPlatform AI Mentor.
    Grounded in authenticated student's confirmed skills, target role, skill gaps,
    learning roadmap, and verified project records.
    """
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one message is required to chat with the mentor.",
        )

    # Format messages as dict list for service
    msg_dicts = [{"role": m.role, "content": m.content.strip()} for m in payload.messages if m.content.strip()]
    if not msg_dicts or msg_dicts[-1]["role"] != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The latest message in the conversation must be from the student ('user').",
        )

    result = await chat_with_ai_mentor(
        db=db,
        user_id=current_user.id,
        messages=msg_dicts,
        session_id=payload.session_id,
    )
    return MentorChatResponse.model_validate(result)


# ==============================================================================
# 11. CAREER FIT REASSESSMENT
# ==============================================================================

@router.post(
    "/reassess",
    response_model=ReassessmentResponse,
    summary="Reassess career fit and record progress delta",
)
async def reassess_career_fit(
    target_role: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Reruns role match analysis against updated student records, compares with previous
    score, tracks improved competencies, and records historical reassessment.
    """
    result = await reassess_student_career_fit(
        db=db,
        user_id=current_user.id,
        target_role=target_role,
        experience_level=experience_level,
    )
    return ReassessmentResponse.model_validate(result)


# ==============================================================================
# 12. LEARNING RESOURCE PROGRESS
# ==============================================================================

@router.post(
    "/resource-progress",
    response_model=ResourceProgressResponse,
    summary="Update learning resource progress (started | completed)",
)
async def set_resource_progress(
    payload: ResourceProgressRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Persists student learning resource engagement status (started | completed).
    """
    result = await update_resource_progress(
        db=db,
        user_id=current_user.id,
        resource_url=payload.resource_url,
        skill_name=payload.skill_name,
        status=payload.status,
    )
    return ResourceProgressResponse.model_validate(result)


