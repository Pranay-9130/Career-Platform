import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Response
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pathlib import Path
import re

from app.core.database import get_db
from app.models.project import Project
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.profile import Profile
from app.models.notification import Notification
from app.models.stored_archive import StoredArchive
from app.schemas.project import ProjectDetailRead
from app.schemas.job import JobRead, JobCreate, JobUpdate
from app.schemas.admin import (
    ProjectModerationAction,
    AdminStats,
    StudentAdminRead,
    ResumeTemplateCreate,
    ResumeTemplateUpdate,
)
from app.api.dependencies.auth import require_role, get_current_active_user
from app.api.routes.projects import _map_project_to_detail_read
from app.services.email_service import EmailService
from app.api.routes.resumes import AVAILABLE_TEMPLATES

router = APIRouter(prefix="/admin", tags=["Admin Moderation"])


@router.get(
    "/stats",
    response_model=AdminStats,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    """
    Retrieve platform-wide operational statistics for the administration dashboard.
    Restricted strictly to administrators.
    """
    pending_stmt = select(func.count(Project.id)).where(Project.status == "Submitted")
    pending_count = (await db.execute(pending_stmt)).scalar() or 0

    pub_stmt = select(func.count(Project.id)).where(Project.status == "Published")
    pub_count = (await db.execute(pub_stmt)).scalar() or 0

    students_stmt = select(func.count(User.id)).where(
        User.role.in_([UserRole.STUDENT, UserRole.CONTRIBUTOR])
    )
    students_count = (await db.execute(students_stmt)).scalar() or 0

    jobs_stmt = select(func.count(Job.id))
    jobs_count = (await db.execute(jobs_stmt)).scalar() or 0

    return AdminStats(
        pending_submissions=pending_count,
        published_projects=pub_count,
        total_students=students_count,
        total_jobs=jobs_count,
        flagged_reports=0,
    )


# =========================================================================
# PROJECT SUBMISSIONS MODERATION
# =========================================================================

@router.get(
    "/projects/queue",
    response_model=List[ProjectDetailRead],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_moderation_queue(
    status_filter: Optional[str] = Query("Submitted", description="Status filter (Submitted, Changes Requested, Rejected, All)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve list of projects for admin moderation.
    """
    conditions = []
    if status_filter and status_filter.strip().lower() != "all":
        conditions.append(Project.status == status_filter.strip())

    stmt = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile),
            selectinload(Project.screenshots_list),
        )
        .where(*conditions)
        .order_by(desc(Project.created_at))
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()

    return [_map_project_to_detail_read(p, is_bookmarked=False) for p in projects]


@router.post(
    "/projects/{identifier}/moderate",
    response_model=ProjectDetailRead,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def moderate_project(
    identifier: str,
    payload: ProjectModerationAction,
    db: AsyncSession = Depends(get_db),
):
    """
    Moderate a student project submission:
    - 'approve': Publishes project & sends confirmation email to student.
    - 'reject': Rejects submission, adds reviewer feedback notes, & emails student.
    - 'request_changes': Requests revisions with feedback notes & emails student.
    """
    project = None
    try:
        project_uuid = uuid.UUID(identifier)
        stmt = (
            select(Project)
            .options(
                selectinload(Project.owner).selectinload(User.profile),
                selectinload(Project.screenshots_list),
            )
            .where(Project.id == project_uuid)
        )
        project = (await db.execute(stmt)).scalar_one_or_none()
    except ValueError:
        pass

    if not project:
        stmt = (
            select(Project)
            .options(
                selectinload(Project.owner).selectinload(User.profile),
                selectinload(Project.screenshots_list),
            )
            .where(Project.slug == identifier)
        )
        project = (await db.execute(stmt)).scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{identifier}' was not found.",
        )

    action = payload.action.lower()
    notif_title = ""
    notif_msg = ""
    notif_type = "INFO"

    if action == "approve":
        project.status = "Published"
        project.published_at = datetime.now(timezone.utc)
        project.reviewer_notes = payload.reviewer_notes or "Project approved for public showcase."
        notif_title = f"Project Approved: {project.title}"
        notif_msg = f"Congratulations! Your project '{project.title}' has been approved and published to the public showcase."
        notif_type = "SUCCESS"
    elif action == "reject":
        project.status = "Rejected"
        project.reviewer_notes = payload.reviewer_notes or "Project submission rejected by moderation."
        notif_title = f"Project Submission Rejected: {project.title}"
        notif_msg = f"Your project '{project.title}' was rejected by moderators. Feedback: {project.reviewer_notes}"
        notif_type = "WARNING"
    elif action == "request_changes":
        project.status = "Changes Requested"
        project.reviewer_notes = (
            payload.reviewer_notes or "Please review feedback notes and update your project."
        )
        notif_title = f"Changes Requested: {project.title}"
        notif_msg = f"Revisions requested for '{project.title}'. Feedback: {project.reviewer_notes}"
        notif_type = "MODERATION"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid moderation action: '{payload.action}'",
        )

    # In-app notification
    if project.owner_id and notif_title:
        notif = Notification(
            user_id=project.owner_id,
            title=notif_title,
            message=notif_msg,
            type=notif_type,
            link_url=f"/projects/{project.slug}",
            is_read=False,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(project)

    # Re-fetch with eager loaded relationships
    q = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile),
            selectinload(Project.screenshots_list),
        )
        .where(Project.id == project.id)
    )
    refreshed = (await db.execute(q)).scalar_one()

    # Dispatch email notification to student with feedback notes
    if refreshed.owner and refreshed.owner.email:
        try:
            await EmailService.send_project_moderation_email(
                to_email=refreshed.owner.email,
                student_name=refreshed.owner.full_name or "Student",
                project_title=refreshed.title,
                action=action,
                reviewer_notes=refreshed.reviewer_notes or "",
            )
        except Exception as exc:
            pass

    return _map_project_to_detail_read(refreshed, is_bookmarked=False)


@router.delete(
    "/projects/{identifier}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def delete_project_as_admin(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a project submission from the platform.
    Restricted to administrators.
    """
    project = None
    try:
        project_uuid = uuid.UUID(identifier)
        stmt = select(Project).where(Project.id == project_uuid)
        project = (await db.execute(stmt)).scalar_one_or_none()
    except ValueError:
        pass

    if not project:
        stmt = select(Project).where(Project.slug == identifier)
        project = (await db.execute(stmt)).scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{identifier}' was not found.",
        )

    title = project.title
    await db.delete(project)
    await db.commit()

    return {"message": f"Project '{title}' has been permanently deleted."}


@router.post(
    "/projects/clear-all",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def clear_all_projects_as_admin(
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete all project submissions from the platform.
    Restricted to administrators.
    """
    stmt = select(Project)
    projects = (await db.execute(stmt)).scalars().all()
    count = len(projects)
    for p in projects:
        await db.delete(p)
    await db.commit()

    return {"message": f"All {count} projects have been deleted."}


# =========================================================================
# JOB MANAGEMENT (Add, Edit, Publish, Unpublish, Delete)
# =========================================================================

@router.get(
    "/jobs",
    response_model=List[JobRead],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_admin_jobs(
    search: Optional[str] = Query(None, description="Search term for title or company"),
    status: Optional[str] = Query("all", description="Filter by active status: 'all', 'active', 'inactive'"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all jobs including draft and inactive/unpublished opportunities for admin oversight.
    """
    conditions = []
    if status == "active":
        conditions.append(Job.is_active.is_(True))
    elif status == "inactive":
        conditions.append(Job.is_active.is_(False))

    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append(
            or_(
                Job.title.ilike(term),
                Job.company_name.ilike(term),
                Job.domain.ilike(term),
            )
        )

    stmt = select(Job).where(*conditions).order_by(desc(Job.created_at))
    result = await db.execute(stmt)
    jobs = result.scalars().all()
    return [JobRead.model_validate(j) for j in jobs]


@router.post(
    "/jobs",
    response_model=JobRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def create_admin_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new job posting with full requirements, responsibilities, and metadata.
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
        skills_required=payload.skills_required or [],
        description=payload.description,
        responsibilities=payload.responsibilities or [],
        requirements=payload.requirements or [],
        apply_url=payload.apply_url,
        is_active=payload.is_active,
        is_featured=payload.is_featured,
        deadline=payload.deadline,
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    return JobRead.model_validate(new_job)


@router.put(
    "/jobs/{identifier}",
    response_model=JobRead,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def update_admin_job(
    identifier: str,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Edit and update an existing job posting.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier: '{identifier}'",
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


@router.patch(
    "/jobs/{identifier}/toggle-status",
    response_model=JobRead,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def toggle_job_status(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Toggle job active status between published (active) and unpublished (inactive).
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier: '{identifier}'",
        )

    stmt = select(Job).where(Job.id == job_uuid)
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{identifier}' not found.",
        )

    job.is_active = not job.is_active
    await db.commit()
    await db.refresh(job)
    return JobRead.model_validate(job)


@router.delete(
    "/jobs/{identifier}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def delete_admin_job(identifier: str, db: AsyncSession = Depends(get_db)):
    """
    Permanently delete a job posting.
    """
    try:
        job_uuid = uuid.UUID(identifier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid job identifier: '{identifier}'",
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


# =========================================================================
# STUDENTS DIRECTORY (View & Inspect registered students)
# =========================================================================

@router.get(
    "/students",
    response_model=List[StudentAdminRead],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_admin_students(
    search: Optional[str] = Query(None, description="Search by name, email, or university"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all registered student profiles with their submission count and academic details.
    """
    conditions = [User.role.in_([UserRole.STUDENT, UserRole.CONTRIBUTOR])]

    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(*conditions)
        .order_by(desc(User.created_at))
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    # Filter by search in python if present
    if search and search.strip():
        term = search.strip().lower()
        filtered = []
        for u in users:
            prof = u.profile
            match_name = u.full_name and term in u.full_name.lower()
            match_email = term in u.email.lower()
            match_uni = prof and prof.university and term in prof.university.lower()
            if match_name or match_email or match_uni:
                filtered.append(u)
        users = filtered

    # Fetch project counts per user
    user_ids = [u.id for u in users]
    proj_counts: Dict[uuid.UUID, int] = {}
    if user_ids:
        count_stmt = (
            select(Project.owner_id, func.count(Project.id))
            .where(Project.owner_id.in_(user_ids))
            .group_by(Project.owner_id)
        )
        count_res = await db.execute(count_stmt)
        for row in count_res.all():
            proj_counts[row[0]] = row[1]

    items = []
    for u in users:
        prof = u.profile
        items.append(
            StudentAdminRead(
                id=u.id,
                email=u.email,
                full_name=u.full_name or "Student",
                headline=u.headline or (prof.headline if prof else None),
                university=prof.university if prof else None,
                degree=prof.degree if prof else None,
                graduation_year=prof.graduation_year if prof else None,
                skills=prof.skills if (prof and prof.skills) else [],
                username=prof.username if prof else None,
                is_verified=u.is_verified,
                is_active=u.is_active,
                created_at=u.created_at,
                projects_count=proj_counts.get(u.id, 0),
            )
        )

    return items


# =========================================================================
# RESUME TEMPLATES MANAGEMENT (Add, List, Delete)
# =========================================================================

@router.get(
    "/templates",
    response_model=List[Dict[str, Any]],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_admin_templates():
    """
    Retrieve all ATS resume templates in the catalog for administration.
    """
    return AVAILABLE_TEMPLATES


@router.post(
    "/templates",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def create_resume_template(payload: ResumeTemplateCreate):
    """
    Add a new ATS-compatible resume template to the platform catalog.
    """
    import re
    # Generate ID if not provided
    template_id = payload.id
    if not template_id or not template_id.strip():
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", payload.name.lower()).strip("-")
        template_id = slug or "custom-template"

    # Ensure unique ID
    candidate_id = template_id
    counter = 1
    while any(t["id"].lower() == candidate_id.lower() for t in AVAILABLE_TEMPLATES):
        candidate_id = f"{template_id}-{counter}"
        counter += 1

    new_template = payload.model_dump()
    new_template["id"] = candidate_id
    new_template["is_custom"] = True
    new_template["is_active"] = payload.is_active if payload.is_active is not None else True
    AVAILABLE_TEMPLATES.append(new_template)
    return new_template


@router.put(
    "/templates/{template_id}",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def update_resume_template(template_id: str, payload: ResumeTemplateUpdate):
    """
    Update an existing template's title, description, badge, preview or download link.
    """
    for t in AVAILABLE_TEMPLATES:
        if t["id"] == template_id:
            update_data = payload.model_dump(exclude_unset=True)
            for k, v in update_data.items():
                if v is not None:
                    t[k] = v
            return t

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Template '{template_id}' was not found.",
    )


@router.patch(
    "/templates/{template_id}/toggle-status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def toggle_resume_template_status(template_id: str):
    """
    Toggle a template between Active (visible to candidates) and Inactive (hidden draft).
    """
    for t in AVAILABLE_TEMPLATES:
        if t["id"] == template_id:
            t["is_active"] = not t.get("is_active", True)
            return {"id": t["id"], "is_active": t["is_active"], "message": "Status updated successfully."}

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Template '{template_id}' was not found.",
    )


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def delete_resume_template(template_id: str):
    """
    Remove a template from the platform catalog.
    """
    found_idx = None
    for idx, t in enumerate(AVAILABLE_TEMPLATES):
        if t["id"] == template_id:
            found_idx = idx
            break

    if found_idx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' was not found.",
        )

    removed = AVAILABLE_TEMPLATES.pop(found_idx)
    return {"message": f"Template '{template_id}' removed successfully.", "removed": removed}


@router.post(
    "/templates/seed-defaults",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def seed_default_templates():
    """
    Seed/restore the clean Resume Templates (Template 1, Template 2, Template 3) as displayed in the templates section.
    """
    demo_defaults = [
        {
            "id": "template-1",
            "name": "Template 1",
            "badge": "Professional",
            "description": "Ready-to-use professional resume format",
            "tagline": "Standard single-column layout preferred by tech recruiters and ATS systems.",
            "ats_score": "98/100",
            "best_for": "Software Engineers, Backend Developers, DevOps",
            "preview_accent": "#F97316",
            "preview_image_url": "",
            "download_url": "",
            "is_active": True,
            "is_custom": False,
        },
        {
            "id": "template-2",
            "name": "Template 2",
            "badge": "Professional",
            "description": "Ready-to-use professional resume format",
            "tagline": "Clean modern hierarchy with subtle slate dividers and high readability.",
            "ats_score": "95/100",
            "best_for": "Full Stack Engineers, Frontend Developers, Product Designers",
            "preview_accent": "#F97316",
            "preview_image_url": "",
            "download_url": "",
            "is_active": True,
            "is_custom": False,
        },
        {
            "id": "template-3",
            "name": "Template 3",
            "badge": "Professional",
            "description": "Ready-to-use professional resume format",
            "tagline": "Structured academic and engineering format highlighting education and projects.",
            "ats_score": "96/100",
            "best_for": "Data Scientists, ML Researchers, Graduate Applicants",
            "preview_accent": "#F97316",
            "preview_image_url": "",
            "download_url": "",
            "is_active": True,
            "is_custom": False,
        },
    ]

    # Prepend or add if not already present
    existing_ids = {t["id"] for t in AVAILABLE_TEMPLATES}
    for item in demo_defaults:
        if item["id"] not in existing_ids:
            AVAILABLE_TEMPLATES.insert(0, item)

    return AVAILABLE_TEMPLATES


@router.post(
    "/templates/clear-all",
    response_model=Dict[str, str],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def clear_all_templates():
    """
    Clear all templates from the catalog so the admin can add their own from scratch.
    """
    AVAILABLE_TEMPLATES.clear()
    return {"message": "All templates cleared. Catalog is now empty."}


MAX_TEMPLATE_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_TEMPLATE_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".zip", ".tex", ".odt", ".rtf", ".txt", ".png", ".jpg", ".jpeg"
}


@router.post(
    "/templates/upload-file",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def upload_template_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Direct upload for resume template files (PDF, Word DOCX, ZIP, LaTeX, etc.).
    Persists durable database record and provides direct candidate download URL.
    """
    raw_filename = file.filename or "template.pdf"
    ext = Path(raw_filename).suffix.lower()
    if ext not in ALLOWED_TEMPLATE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_TEMPLATE_EXTENSIONS))}",
        )

    content = await file.read(MAX_TEMPLATE_FILE_SIZE + 1)
    if len(content) > MAX_TEMPLATE_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds maximum allowed size of 25MB.",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", Path(raw_filename).name)
    storage_key = f"templates/{uuid.uuid4().hex[:12]}_{safe_name}"

    # 1. Save in database (survives container teardown and ephemeral disks)
    stored = StoredArchive(
        storage_key=storage_key,
        owner_id=current_user.id,
        content=content,
    )
    db.add(stored)
    await db.commit()

    # 2. Also cache to local disk if available
    try:
        disk_dir = Path("uploads/templates")
        disk_dir.mkdir(parents=True, exist_ok=True)
        (disk_dir / Path(storage_key).name).write_bytes(content)
    except Exception:
        pass

    media_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".zip": "application/zip",
        ".tex": "text/x-tex",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".rtf": "application/rtf",
        ".txt": "text/plain",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return {
        "download_url": f"/api/admin/templates/file/{storage_key}",
        "filename": raw_filename,
        "size_bytes": len(content),
        "media_type": media_type,
    }


@router.get("/templates/file/{storage_key:path}")
async def serve_template_file(storage_key: str, db: AsyncSession = Depends(get_db)):
    """
    Public direct download endpoint for uploaded resume templates.
    """
    stmt = select(StoredArchive).where(StoredArchive.storage_key == storage_key)
    archive = (await db.execute(stmt)).scalar_one_or_none()

    content = None
    if archive:
        content = archive.content
    else:
        disk_path = Path("uploads/templates") / Path(storage_key).name
        if disk_path.exists():
            content = disk_path.read_bytes()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template file not found.",
        )

    filename = Path(storage_key).name
    if "_" in filename:
        clean_filename = filename.split("_", 1)[1]
    else:
        clean_filename = filename

    ext = Path(clean_filename).suffix.lower()
    media_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".doc": "application/msword",
        ".zip": "application/zip",
        ".tex": "text/x-tex",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".rtf": "application/rtf",
        ".txt": "text/plain",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"',
            "Cache-Control": "public, max-age=3600",
        },
    )
