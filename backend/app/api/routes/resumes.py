import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.profile_links import clean_social_profile_url
from app.models.resume import Resume
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.models.job import Job
from app.schemas.resume import (
    ResumeRead,
    ResumeCreate,
    ResumeUpdate,
    ResumeListResponse,
)
from app.schemas.ats import AtsAnalysisRequest, AtsAnalysisResponse
from app.api.dependencies.auth import get_current_active_user
from app.core.rate_limiter import ai_rate_limiter
from app.services.pdf_generator import generate_resume_pdf
from app.services.ats_analyzer import analyze_ats, extract_resume_text_from_dict

router = APIRouter(prefix="/resumes", tags=["Resume Builder"])

AVAILABLE_TEMPLATES = [
    {
        "id": "classic-tech",
        "name": "Classic Tech",
        "tagline": "Ivy-league single column layout standard preferred by FAANG recruiters and ATS systems.",
        "description": "Standardized, highly parseable ATS layout with clean serif/sans typography, prominent technical skills matrix, and bullet-point impact metrics.",
        "badge": "Highest ATS Score",
        "ats_score": "98/100",
        "best_for": "Software Engineers, Backend Developers, DevOps",
        "preview_accent": "#0284c7",
    },
    {
        "id": "modern-minimal",
        "name": "Modern Minimal",
        "tagline": "Sleek, contemporary aesthetic featuring subtle dividers and structured section blocks.",
        "description": "Clean modern hierarchy with subtle slate dividers and high-readability typography designed for high-growth tech companies.",
        "badge": "Popular",
        "ats_score": "95/100",
        "best_for": "Full Stack Engineers, Frontend Developers, Product Designers",
        "preview_accent": "#2563eb",
    },
    {
        "id": "research-academic",
        "name": "Research & Academic",
        "tagline": "Curated for students highlighting publications, capstones, thesis, and university honors.",
        "description": "Structured academic format highlighting education, coursework, publications, laboratory experience, and open-source contributions.",
        "badge": "Academic",
        "ats_score": "94/100",
        "best_for": "Data Scientists, ML/AI Researchers, Graduate Applicants",
        "preview_accent": "#0d9488",
    },
    {
        "id": "compact-dense",
        "name": "Compact Executive",
        "tagline": "Dense, single-page powerhouse layout maximizing impact per square inch without clutter.",
        "description": "Tight margins and compact spacing specifically calibrated to fit extensive internship experience and multiple flagship projects onto 1 page.",
        "badge": "High Density",
        "ats_score": "96/100",
        "best_for": "Multi-internship candidates, Senior students, Career switchers",
        "preview_accent": "#4f46e5",
    },
]


@router.get("/templates", response_model=List[Dict[str, Any]])
async def list_templates():
    """
    Public catalogue of ATS resume templates.
    """
    return [t for t in AVAILABLE_TEMPLATES if t.get("is_active", True)]


@router.get("", response_model=ResumeListResponse)
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all resumes belonging to the authenticated student.
    """
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(desc(Resume.is_primary), desc(Resume.updated_at))
    )
    result = await db.execute(stmt)
    resumes = result.scalars().all()
    return ResumeListResponse(
        items=[ResumeRead.model_validate(r) for r in resumes],
        total=len(resumes),
    )


@router.post("", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def create_resume(
    payload: ResumeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new resume. If is_primary is set, unsets primary on other user resumes.
    """
    if payload.is_primary:
        await db.execute(
            update(Resume)
            .where(Resume.user_id == current_user.id)
            .values(is_primary=False)
        )

    # If personal_info is empty, prepopulate from user basic fields
    personal_info = dict(payload.personal_info) if payload.personal_info else {}
    if not personal_info.get("full_name"):
        personal_info["full_name"] = current_user.full_name or "Alex Developer"
    if not personal_info.get("email"):
        personal_info["email"] = current_user.email

    resume = Resume(
        user_id=current_user.id,
        title=payload.title,
        template_id=payload.template_id,
        personal_info=personal_info,
        summary=payload.summary or "",
        education=payload.education,
        experience=payload.experience,
        projects=payload.projects,
        skills=payload.skills,
        certifications=payload.certifications,
        is_primary=payload.is_primary,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return ResumeRead.model_validate(resume)


@router.post("/seed-from-profile", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def seed_resume_from_profile(
    template_id: str = Query("classic-tech", description="Selected template ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Auto-generate a new ATS resume pre-populated with user's profile info and project submissions.
    """
    # Load profile if available
    prof_stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(prof_stmt)).scalars().first()

    # Load projects owned by user
    proj_stmt = (
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(desc(Project.created_at))
        .limit(3)
    )
    user_projects = (await db.execute(proj_stmt)).scalars().all()

    full_name = current_user.full_name or ""
    personal_info = {
        "full_name": full_name,
        "email": current_user.email,
        "phone": "",
        "location": "",
        "github": clean_social_profile_url(profile.github_url, "github") if profile else "",
        "linkedin": clean_social_profile_url(profile.linkedin_url, "linkedin") if profile else "",
        "portfolio": profile.portfolio_url if profile and profile.portfolio_url else "",
    }

    summary = profile.bio if profile and profile.bio else ""

    education = []
    if profile and (profile.university or profile.degree):
        education.append({
            "institution": profile.university or "",
            "degree": profile.degree or "",
            "location": "",
            "start_date": "",
            "end_date": str(profile.graduation_year) if profile.graduation_year else "",
            "gpa": "",
            "highlights": "",
        })

    experience = []

    projects = []
    if user_projects:
        for p in user_projects:
            projects.append({
                "name": p.title,
                "tech_stack": ", ".join(p.tech_stack) if isinstance(p.tech_stack, list) else str(p.tech_stack or ""),
                "link": p.github_url or p.live_demo_url or "",
                "bullets": [
                    p.short_description or "",
                ] if p.short_description else [""],
            })

    skills = profile.skills if profile and profile.skills else []
    certifications = []

    resume = Resume(
        user_id=current_user.id,
        title=f"{full_name or 'My'} ATS Resume",
        template_id=template_id,
        personal_info=personal_info,
        summary=summary,
        education=education,
        experience=experience,
        projects=projects,
        skills=skills,
        certifications=certifications,
        is_primary=True,
    )
    # Set existing resumes to not primary
    await db.execute(
        update(Resume)
        .where(Resume.user_id == current_user.id)
        .values(is_primary=False)
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return ResumeRead.model_validate(resume)


@router.get("/{resume_id}", response_model=ResumeRead)
async def get_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Fetch a single resume by UUID.
    """
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    resume = (await db.execute(stmt)).scalars().first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeRead.model_validate(resume)


@router.put("/{resume_id}", response_model=ResumeRead)
async def update_resume(
    resume_id: uuid.UUID,
    payload: ResumeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update resume fields.
    """
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    resume = (await db.execute(stmt)).scalars().first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    update_data = payload.model_dump(exclude_unset=True)

    if update_data.get("is_primary") is True:
        await db.execute(
            update(Resume)
            .where(Resume.user_id == current_user.id)
            .values(is_primary=False)
        )

    for field, value in update_data.items():
        setattr(resume, field, value)

    await db.commit()
    await db.refresh(resume)
    return ResumeRead.model_validate(resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a resume.
    """
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    resume = (await db.execute(stmt)).scalars().first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    await db.delete(resume)
    await db.commit()
    return None


@router.post("/{resume_id}/duplicate", response_model=ResumeRead, status_code=status.HTTP_201_CREATED)
async def duplicate_resume(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Clone an existing resume into a new draft.
    """
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    source = (await db.execute(stmt)).scalars().first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    cloned = Resume(
        user_id=current_user.id,
        title=f"{source.title} (Copy)",
        template_id=source.template_id,
        personal_info=dict(source.personal_info or {}),
        summary=source.summary,
        education=list(source.education or []),
        experience=list(source.experience or []),
        projects=list(source.projects or []),
        skills=list(source.skills or []),
        certifications=list(source.certifications or []),
        is_primary=False,
    )
    db.add(cloned)
    await db.commit()
    await db.refresh(cloned)
    return ResumeRead.model_validate(cloned)


@router.get("/{resume_id}/export-pdf")
async def export_resume_pdf(
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Render and export ATS-compliant PDF for the specified resume.
    """
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    resume = (await db.execute(stmt)).scalars().first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    resume_dict = {
        "title": resume.title,
        "template_id": resume.template_id,
        "personal_info": resume.personal_info or {},
        "summary": resume.summary or "",
        "education": resume.education or [],
        "experience": resume.experience or [],
        "projects": resume.projects or [],
        "skills": resume.skills or [],
        "certifications": resume.certifications or [],
    }

    try:
        pdf_bytes = generate_resume_pdf(resume_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ATS PDF: {str(exc)}",
        )

    # Clean filename
    full_name = (resume.personal_info or {}).get("full_name") or current_user.full_name or "Resume"
    safe_name = "".join(c for c in full_name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    filename = f"{safe_name}_ATS_Resume.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post("/preview-pdf")
async def preview_resume_pdf(
    payload: ResumeCreate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Render live vector ATS PDF on the fly without saving to database.
    """
    resume_dict = payload.model_dump()
    try:
        pdf_bytes = generate_resume_pdf(resume_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to render preview PDF: {str(exc)}",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'inline; filename="Resume_Preview.pdf"',
        },
    )


@router.post(
    "/analyze-ats",
    response_model=AtsAnalysisResponse,
    dependencies=[Depends(ai_rate_limiter)],
)
async def analyze_resume_ats(
    payload: AtsAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Dual-input ATS analysis comparing candidate resume against a target job description.
    Supports either saved resume UUID / raw text and platform job UUID / custom JD text.
    """
    # 1. Resolve Resume Text
    resume_text = ""
    if payload.resume_id:
        stmt = select(Resume).where(Resume.id == payload.resume_id, Resume.user_id == current_user.id)
        resume = (await db.execute(stmt)).scalars().first()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified resume was not found")
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
        resume_text = extract_resume_text_from_dict(resume_dict)
    elif payload.resume_text and payload.resume_text.strip():
        resume_text = payload.resume_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'resume_id' or non-empty 'resume_text' must be provided",
        )

    # 2. Resolve Job Description Text
    job_description = ""
    if payload.job_id:
        j_stmt = select(Job).where(Job.id == payload.job_id)
        job = (await db.execute(j_stmt)).scalars().first()
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified job was not found")
        skills_str = ", ".join(job.skills_required) if isinstance(job.skills_required, list) else str(job.skills_required or "")
        reqs_str = "\n".join(f"- {r}" for r in job.requirements) if isinstance(job.requirements, list) else str(job.requirements or "")
        resps_str = "\n".join(f"- {r}" for r in job.responsibilities) if isinstance(job.responsibilities, list) else str(job.responsibilities or "")
        job_description = (
            f"Title: {job.title}\n"
            f"Company: {job.company_name}\n"
            f"Domain: {job.domain}\n"
            f"Skills Required: {skills_str}\n\n"
            f"Overview:\n{job.description}\n\n"
            f"Responsibilities:\n{resps_str}\n\n"
            f"Requirements:\n{reqs_str}\n"
        )
    elif payload.job_description and payload.job_description.strip():
        job_description = payload.job_description.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'job_id' or non-empty 'job_description' must be provided",
        )

    # 3. Perform AI / NLP Analysis
    try:
        result = await analyze_ats(resume_text, job_description)
        return AtsAnalysisResponse.model_validate(result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS analysis error: {str(exc)}",
        )
