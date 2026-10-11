import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.job_application import JobApplication
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.job_application import (
    JobApplicationRead,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationStats,
)
from app.api.dependencies.auth import get_current_active_user

router = APIRouter(prefix="/applications", tags=["Job Applications Tracker"])


@router.get("/stats", response_model=JobApplicationStats)
async def get_application_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve application pipeline counts for the authenticated student.
    """
    stmt = (
        select(JobApplication.status, func.count(JobApplication.id))
        .where(JobApplication.user_id == current_user.id)
        .group_by(JobApplication.status)
    )
    rows = (await db.execute(stmt)).all()
    counts = {r[0]: r[1] for r in rows}

    saved = counts.get("Saved", 0)
    applied = counts.get("Applied", 0)
    interviewing = counts.get("Interviewing", 0)
    offer = counts.get("Offer", 0)
    rejected = counts.get("Rejected", 0)
    total = sum(counts.values())

    return JobApplicationStats(
        total=total,
        saved=saved,
        applied=applied,
        interviewing=interviewing,
        offer=offer,
        rejected=rejected,
    )


@router.get("", response_model=List[JobApplicationRead])
async def list_applications(
    status_filter: Optional[str] = Query(None, description="Status filter: Saved, Applied, Interviewing, Offer, Rejected"),
    search: Optional[str] = Query(None, description="Keyword search in company or role title"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all tracked job applications for the current student.
    """
    conditions = [JobApplication.user_id == current_user.id]

    if status_filter and status_filter.strip() and status_filter.strip().lower() != "all":
        conditions.append(JobApplication.status == status_filter.strip())

    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            (JobApplication.company_name.ilike(term)) | (JobApplication.position_title.ilike(term))
        )

    stmt = (
        select(JobApplication)
        .where(*conditions)
        .order_by(desc(JobApplication.updated_at), desc(JobApplication.created_at))
    )
    result = await db.execute(stmt)
    apps = result.scalars().all()
    return [JobApplicationRead.model_validate(a) for a in apps]


@router.post("", response_model=JobApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: JobApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Track a new job application in the student pipeline.
    If job_id is provided, automatically links with platform opportunity.
    """
    company_name = payload.company_name
    position_title = payload.position_title
    job_location = payload.job_location
    work_mode = payload.work_mode
    salary_or_stipend = payload.salary_or_stipend
    job_url = payload.job_url

    # If linked to a platform Job, populate fallback fields if empty
    if payload.job_id:
        job_stmt = select(Job).where(Job.id == payload.job_id)
        job = (await db.execute(job_stmt)).scalar_one_or_none()
        if job:
            if not company_name:
                company_name = job.company_name
            if not position_title:
                position_title = job.title
            if not job_location or job_location == "Remote":
                job_location = job.location
            if not work_mode or work_mode == "Remote":
                work_mode = job.work_mode
            if not salary_or_stipend:
                salary_or_stipend = job.stipend_or_salary
            if not job_url:
                job_url = job.apply_url

    new_app = JobApplication(
        user_id=current_user.id,
        job_id=payload.job_id,
        company_name=company_name,
        position_title=position_title,
        job_location=job_location,
        work_mode=work_mode,
        salary_or_stipend=salary_or_stipend,
        job_url=job_url,
        status=payload.status,
        applied_date=payload.applied_date or datetime.now(timezone.utc),
        next_interview_date=payload.next_interview_date,
        notes=payload.notes,
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return JobApplicationRead.model_validate(new_app)


@router.get("/{identifier}", response_model=JobApplicationRead)
async def get_application(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve single tracked application by UUID.
    """
    try:
        app_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid application identifier: '{identifier}'",
        )

    stmt = select(JobApplication).where(JobApplication.id == app_uuid)
    app_obj = (await db.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{identifier}' was not found.",
        )

    if app_obj.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this application.",
        )

    return JobApplicationRead.model_validate(app_obj)


@router.put("/{identifier}", response_model=JobApplicationRead)
async def update_application(
    identifier: str,
    payload: JobApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update application status stage (e.g. Applied -> Interviewing -> Offer), notes, or dates.
    """
    try:
        app_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid application identifier: '{identifier}'",
        )

    stmt = select(JobApplication).where(JobApplication.id == app_uuid)
    app_obj = (await db.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{identifier}' was not found.",
        )

    if app_obj.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this application.",
        )

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(app_obj, field, val)

    await db.commit()
    await db.refresh(app_obj)
    return JobApplicationRead.model_validate(app_obj)


@router.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove application from tracking pipeline.
    """
    try:
        app_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid application identifier: '{identifier}'",
        )

    stmt = select(JobApplication).where(JobApplication.id == app_uuid)
    app_obj = (await db.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{identifier}' was not found.",
        )

    if app_obj.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this application.",
        )

    await db.delete(app_obj)
    await db.commit()
    return None
