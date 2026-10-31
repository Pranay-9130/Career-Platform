import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_, desc, asc, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.job import Job
from app.models.job_bookmark import JobBookmark
from app.models.user import User, UserRole
from app.schemas.job import (
    JobRead,
    JobCreate,
    JobUpdate,
    JobListResponse,
    JobFacets,
    JobFacetItem,
    JobBookmarkToggleResponse,
)
from app.api.dependencies.auth import (
    require_role,
    get_optional_current_user,
    get_current_active_user,
)

router = APIRouter(prefix="/jobs", tags=["Jobs & Opportunities"])


async def _compute_job_facets(db: AsyncSession) -> JobFacets:
    """
    Computes aggregated count of active jobs per domain, job_type, work_mode, and experience_level.
    """
    # 1. Domains
    domain_stmt = (
        select(Job.domain, func.count(Job.id))
        .where(Job.is_active.is_(True))
        .group_by(Job.domain)
        .order_by(desc(func.count(Job.id)))
    )
    domain_rows = (await db.execute(domain_stmt)).all()
    domains = [JobFacetItem(name=row[0], count=row[1]) for row in domain_rows if row[0]]

    # 2. Job Types
    type_stmt = (
        select(Job.job_type, func.count(Job.id))
        .where(Job.is_active.is_(True))
        .group_by(Job.job_type)
        .order_by(desc(func.count(Job.id)))
    )
    type_rows = (await db.execute(type_stmt)).all()
    job_types = [JobFacetItem(name=row[0], count=row[1]) for row in type_rows if row[0]]

    # 3. Work Modes
    mode_stmt = (
        select(Job.work_mode, func.count(Job.id))
        .where(Job.is_active.is_(True))
        .group_by(Job.work_mode)
        .order_by(desc(func.count(Job.id)))
    )
    mode_rows = (await db.execute(mode_stmt)).all()
    work_modes = [JobFacetItem(name=row[0], count=row[1]) for row in mode_rows if row[0]]

    # 4. Experience Levels
    exp_stmt = (
        select(Job.experience_level, func.count(Job.id))
        .where(Job.is_active.is_(True))
        .group_by(Job.experience_level)
        .order_by(desc(func.count(Job.id)))
    )
    exp_rows = (await db.execute(exp_stmt)).all()
    experience_levels = [
        JobFacetItem(name=row[0], count=row[1]) for row in exp_rows if row[0]
    ]

    # 5. Candidate Types
    c_stmt = (
        select(Job.candidate_type, func.count(Job.id))
        .where(Job.is_active.is_(True), Job.candidate_type.isnot(None), Job.candidate_type != "")
        .group_by(Job.candidate_type)
        .order_by(desc(func.count(Job.id)))
    )
    c_rows = (await db.execute(c_stmt)).all()
    candidate_types = [
        JobFacetItem(name=row[0], count=row[1]) for row in c_rows if row[0]
    ]

    return JobFacets(
        domains=domains,
        job_types=job_types,
        work_modes=work_modes,
        experience_levels=experience_levels,
        candidate_types=candidate_types,
    )


@router.get("", response_model=JobListResponse)
async def list_jobs(
    search: Optional[str] = Query(None, description="Search keyword in title, company, skills, or description"),
    domain: Optional[str] = Query(None, description="Domain filter (e.g., Software Engineering, AI / ML)"),
    job_type: Optional[str] = Query(None, description="Type filter (Full-time, Internship, Contract)"),
    work_mode: Optional[str] = Query(None, description="Work mode (Remote, Hybrid, Onsite)"),
    experience_level: Optional[str] = Query(None, description="Level (Internship, Entry Level, Mid-Level)"),
    graduation_batch: Optional[str] = Query(None, description="Filter by graduation year (e.g., 2025 or All Batches)"),
    candidate_type: Optional[str] = Query(None, description="Filter by candidate type (Freshers Only, Experienced Only, Both Freshers and Experienced)"),
    qualification: Optional[str] = Query(None, description="Filter by qualification (e.g., B.Tech, MCA)"),
    featured_only: bool = Query(False, description="Filter only featured opportunities"),
    sort: str = Query("newest", pattern="^(newest|title|company)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    include_facets: bool = Query(True, description="Include filter facets in the response"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Public discovery catalog of verified job and internship postings with
    multi-faceted filtering, keyword search, and pagination.
    """
    conditions = [Job.is_active.is_(True)]

    if featured_only:
        conditions.append(Job.is_featured.is_(True))

    if domain and domain.strip() and domain.strip().lower() != "all":
        conditions.append(Job.domain.ilike(f"%{domain.strip()}%"))

    if job_type and job_type.strip() and job_type.strip().lower() != "all":
        conditions.append(Job.job_type.ilike(f"%{job_type.strip()}%"))

    if work_mode and work_mode.strip() and work_mode.strip().lower() != "all":
        conditions.append(Job.work_mode.ilike(f"%{work_mode.strip()}%"))

    if experience_level and experience_level.strip() and experience_level.strip().lower() != "all":
        conditions.append(Job.experience_level.ilike(f"%{experience_level.strip()}%"))

    if graduation_batch and graduation_batch.strip() and graduation_batch.strip().lower() != "all":
        b_term = graduation_batch.strip()
        if b_term != "All Batches":
            conditions.append(
                or_(
                    cast(Job.eligible_batches, String).ilike('%"All Batches"%'),
                    cast(Job.eligible_batches, String).ilike(f'%"{b_term}"%'),
                    Job.eligible_batches.is_(None),
                    cast(Job.eligible_batches, String) == "[]",
                )
            )

    if candidate_type and candidate_type.strip() and candidate_type.strip().lower() != "all":
        c_term = candidate_type.strip()
        if c_term == "Freshers Only":
            conditions.append(
                or_(
                    Job.candidate_type == "Freshers Only",
                    Job.candidate_type == "Both Freshers and Experienced",
                    Job.candidate_type.is_(None),
                    Job.candidate_type == "",
                )
            )
        elif c_term == "Experienced Only":
            conditions.append(
                or_(
                    Job.candidate_type == "Experienced Only",
                    Job.candidate_type == "Both Freshers and Experienced",
                    Job.candidate_type.is_(None),
                    Job.candidate_type == "",
                )
            )
        elif c_term == "Both Freshers and Experienced":
            conditions.append(
                or_(
                    Job.candidate_type == "Both Freshers and Experienced",
                    Job.candidate_type.is_(None),
                    Job.candidate_type == "",
                )
            )

    if qualification and qualification.strip() and qualification.strip().lower() != "all":
        q_term = qualification.strip()
        conditions.append(
            or_(
                cast(Job.eligible_qualifications, String).ilike(f'%"{q_term}"%'),
                Job.eligible_qualifications.is_(None),
                cast(Job.eligible_qualifications, String) == "[]",
            )
        )

    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Job.title.ilike(term),
                Job.company_name.ilike(term),
                Job.domain.ilike(term),
                Job.description.ilike(term),
                cast(Job.skills_required, String).ilike(term),
            )
        )

    # Count total
    count_stmt = select(func.count(Job.id)).where(*conditions)
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Sorting
    order_clauses = []
    if sort == "title":
        order_clauses.append(asc(Job.title))
    elif sort == "company":
        order_clauses.append(asc(Job.company_name))
    else:  # newest
        order_clauses.extend([desc(Job.is_featured), desc(Job.created_at)])

    # Pagination
    offset = (page - 1) * limit
    stmt = (
        select(Job)
        .where(*conditions)
        .order_by(*order_clauses)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    facets = await _compute_job_facets(db) if include_facets else JobFacets(
        domains=[],
        job_types=[],
        work_modes=[],
        experience_levels=[],
    )

    # Check bookmarks for authenticated user
    bookmarked_job_ids = set()
    if current_user:
        bm_stmt = select(JobBookmark.job_id).where(JobBookmark.user_id == current_user.id)
        bm_res = await db.execute(bm_stmt)
        bookmarked_job_ids = set(bm_res.scalars().all())

    items = []
    for j in jobs:
        read_obj = JobRead.model_validate(j)
        read_obj.is_bookmarked = j.id in bookmarked_job_ids
        items.append(read_obj)

    return JobListResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        facets=facets,
    )


@router.get("/facets", response_model=JobFacets)
async def get_job_facets(db: AsyncSession = Depends(get_db)):
    """
    Retrieve filter facet counts for jobs and internships.
    """
    return await _compute_job_facets(db)


@router.get("/bookmarks/my", response_model=List[JobRead])
async def get_my_bookmarked_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve all job opportunities saved/bookmarked by the authenticated student.
    """
    stmt = (
        select(Job)
        .join(JobBookmark, JobBookmark.job_id == Job.id)
        .where(JobBookmark.user_id == current_user.id, Job.is_active.is_(True))
        .order_by(desc(JobBookmark.created_at))
    )
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    items = []
    for j in jobs:
        read_obj = JobRead.model_validate(j)
        read_obj.is_bookmarked = True
        items.append(read_obj)
    return items


@router.post("/{identifier}/bookmark", response_model=JobBookmarkToggleResponse)
async def toggle_job_bookmark(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Toggle bookmark status for a job opportunity for the authenticated student.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier format: '{identifier}'",
        )

    stmt = select(Job).where(Job.id == job_uuid)
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{identifier}' was not found.",
        )

    bm_stmt = select(JobBookmark).where(
        JobBookmark.user_id == current_user.id,
        JobBookmark.job_id == job.id,
    )
    existing_bm = (await db.execute(bm_stmt)).scalar_one_or_none()

    if existing_bm:
        await db.delete(existing_bm)
        await db.commit()
        return JobBookmarkToggleResponse(
            job_id=job.id,
            bookmarked=False,
            message="Job removed from your saved workspace.",
        )
    else:
        new_bm = JobBookmark(user_id=current_user.id, job_id=job.id)
        db.add(new_bm)
        await db.commit()
        return JobBookmarkToggleResponse(
            job_id=job.id,
            bookmarked=True,
            message="Job saved to your workspace.",
        )


@router.get("/{identifier}", response_model=JobRead)
async def get_job_by_id(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve single job details by UUID identifier. Requires authentication.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier format: '{identifier}'",
        )

    stmt = select(Job).where(Job.id == job_uuid)
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting '{identifier}' was not found or is no longer active.",
        )

    is_bookmarked = False
    if current_user:
        bm_stmt = select(JobBookmark).where(
            JobBookmark.user_id == current_user.id,
            JobBookmark.job_id == job.id,
        )
        existing_bm = (await db.execute(bm_stmt)).scalar_one_or_none()
        is_bookmarked = existing_bm is not None

    read_obj = JobRead.model_validate(job)
    read_obj.is_bookmarked = is_bookmarked
    return read_obj


@router.post(
    "",
    response_model=JobRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new job or internship opportunity. Restricted to administrators.
    """
    new_job = Job(
        title=payload.title,
        company_name=payload.company_name,
        company_logo_url=payload.company_logo_url,
        company_website=payload.company_website,
        domain=payload.domain,
        job_type=payload.job_type,
        work_mode=payload.work_mode,
        location=payload.location,
        stipend_or_salary=payload.stipend_or_salary,
        experience_level=payload.experience_level,
        skills_required=payload.skills_required,
        description=payload.description,
        responsibilities=payload.responsibilities,
        requirements=payload.requirements,
        apply_url=payload.apply_url,
        application_method=payload.application_method or "INTERNAL",
        application_url=payload.application_url,
        recruiter_email=payload.recruiter_email,
        application_instructions=payload.application_instructions,
        is_active=payload.is_active,
        is_featured=payload.is_featured,
        application_start_date=payload.application_start_date,
        deadline=payload.deadline,
        eligible_batches=payload.eligible_batches or [],
        candidate_type=payload.candidate_type,
        eligible_qualifications=payload.eligible_qualifications or [],
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return JobRead.model_validate(new_job)


@router.put(
    "/{identifier}",
    response_model=JobRead,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def update_job(
    identifier: str,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing job posting. Restricted to administrators.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier format: '{identifier}'",
        )

    stmt = select(Job).where(Job.id == job_uuid)
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{identifier}' not found.",
        )

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(job, field, val)

    await db.commit()
    await db.refresh(job)
    return JobRead.model_validate(job)


@router.delete(
    "/{identifier}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def delete_job(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Deactivate or delete a job posting. Restricted to administrators.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier format: '{identifier}'",
        )

    stmt = select(Job).where(Job.id == job_uuid)
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{identifier}' not found.",
        )

    await db.delete(job)
    await db.commit()
    return None
