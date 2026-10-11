import math
import re
import secrets
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import select, func, or_, cast, String, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.project import Project
from app.models.project_screenshot import ProjectScreenshot
from app.models.project_bookmark import ProjectBookmark
from app.models.profile import Profile
from app.models.user import User, UserRole
from app.services.zip_service import (
    validate_and_inspect_zip,
    save_zip_archive,
    get_zip_file_path,
)
from app.schemas.project import (
    ProjectRead,
    ProjectDetailRead,
    ScreenshotItem,
    ContributorItem,
    ProjectCreate,
    ProjectUpdate,
    ProjectListResponse,
    ProjectFacets,
    FacetItem,
    BookmarkToggleResponse,
)
from app.api.dependencies import get_optional_current_user, get_current_active_user

router = APIRouter(prefix="/projects", tags=["Projects"])


def _generate_slug(title: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s-]", "", title).strip().lower()
    slug = re.sub(r"[\s-]+", "-", cleaned).strip("-")
    return slug or "project"


def _map_project_to_read(project: Project, is_bookmarked: bool = False) -> ProjectRead:
    author_name = project.owner.full_name if project.owner else "Platform Contributor"
    author_avatar = (
        project.owner.avatar_url
        if project.owner and project.owner.avatar_url
        else (project.owner.full_name[:2].upper() if project.owner else "PC")
    )
    author_username = (
        project.owner.profile.username
        if project.owner and project.owner.profile
        else None
    )

    return ProjectRead(
        id=project.id,
        title=project.title,
        slug=project.slug,
        owner_id=project.owner_id,
        author_name=author_name,
        author_avatar=author_avatar,
        author_username=author_username,
        domain=project.domain,
        short_description=project.short_description,
        difficulty=project.difficulty,
        estimated_duration=project.estimated_duration,
        tech_stack=project.tech_stack or [],
        cover_image_url=project.cover_image_url,
        github_url=project.github_url,
        live_demo_url=project.live_demo_url,
        video_demo_url=project.video_demo_url,
        status=project.status,
        reviewer_notes=project.reviewer_notes,
        views_count=project.views_count,
        stars_count=project.stars_count,
        bookmarks_count=project.bookmarks_count,
        is_bookmarked=is_bookmarked,
        published_at=project.published_at,
        created_at=project.created_at,
    )


def _map_project_to_detail_read(
    project: Project,
    is_bookmarked: bool = False,
    profile_map: Optional[dict] = None,
    owner_profile: Optional[Profile] = None,
) -> ProjectDetailRead:
    p_prof = owner_profile or (
        project.owner.profile
        if project.owner and hasattr(project.owner, "profile") and project.owner.profile
        else None
    )

    author_name = project.owner.full_name if project.owner else "Platform Contributor"
    author_avatar = (
        (p_prof.avatar_url if p_prof and p_prof.avatar_url else None)
        or (project.owner.avatar_url if project.owner and project.owner.avatar_url else None)
        or (project.owner.full_name[:2].upper() if project.owner else "PC")
    )
    author_username = p_prof.username if p_prof else None

    screenshots_data: List[ScreenshotItem] = []
    if hasattr(project, "screenshots_list") and project.screenshots_list:
        screenshots_data = [
            ScreenshotItem(
                id=s.id,
                image_url=s.image_url,
                caption=s.caption,
                order_index=s.order_index,
            )
            for s in sorted(project.screenshots_list, key=lambda x: x.order_index)
        ]
    elif project.screenshots and isinstance(project.screenshots, list):
        for idx, s in enumerate(project.screenshots):
            if isinstance(s, dict):
                screenshots_data.append(
                    ScreenshotItem(
                        image_url=s.get("image_url", ""),
                        caption=s.get("caption"),
                        order_index=s.get("order_index", idx),
                    )
                )
            elif isinstance(s, str):
                screenshots_data.append(
                    ScreenshotItem(
                        image_url=s,
                        caption=None,
                        order_index=idx,
                    )
                )

    contributors_data: List[ContributorItem] = []
    if project.contributors and isinstance(project.contributors, list):
        for c in project.contributors:
            if isinstance(c, dict):
                p_user = c.get("profile_username")
                avatar = c.get("avatar_url")
                if not avatar and p_user and profile_map and p_user.lower() in profile_map:
                    avatar = profile_map[p_user.lower()]
                contributors_data.append(
                    ContributorItem(
                        name=c.get("name", "Contributor"),
                        role=c.get("role", "Contributor"),
                        github_username=c.get("github_username"),
                        profile_username=p_user,
                        avatar_url=avatar,
                        email=c.get("email"),
                    )
                )
            elif isinstance(c, str):
                contributors_data.append(
                    ContributorItem(name=c, role="Contributor")
                )

    author_headline = project.owner.headline if project.owner else None
    author_bio = None
    author_university = None
    author_github = None
    author_linkedin = None
    author_portfolio = None

    if p_prof:
        author_headline = p_prof.headline or author_headline
        author_bio = p_prof.bio
        author_university = p_prof.university
        author_github = p_prof.github_url
        author_linkedin = p_prof.linkedin_url
        author_portfolio = p_prof.portfolio_url

    download_url = project.github_url
    if project.zip_storage_key:
        download_url = f"/api/projects/{project.slug}/download"

    return ProjectDetailRead(
        id=project.id,
        title=project.title,
        slug=project.slug,
        owner_id=project.owner_id,
        author_name=author_name,
        author_avatar=author_avatar,
        author_username=author_username,
        author_headline=author_headline,
        author_bio=author_bio,
        author_university=author_university,
        author_github=author_github,
        author_linkedin=author_linkedin,
        author_portfolio=author_portfolio,
        domain=project.domain,
        short_description=project.short_description,
        problem_statement=project.problem_statement or "",
        objectives=project.objectives,
        features=project.features or [],
        tech_stack=project.tech_stack or [],
        prerequisites=project.prerequisites,
        difficulty=project.difficulty,
        estimated_duration=project.estimated_duration,
        expected_outcome=project.expected_outcome,
        cover_image_url=project.cover_image_url,
        screenshots=screenshots_data,
        contributors=contributors_data,
        github_url=project.github_url,
        live_demo_url=project.live_demo_url,
        video_demo_url=project.video_demo_url,
        zip_download_url=download_url,
        zip_file_size_bytes=project.zip_file_size_bytes or 0,
        status=project.status,
        reviewer_notes=project.reviewer_notes,
        views_count=project.views_count,
        stars_count=project.stars_count,
        bookmarks_count=project.bookmarks_count,
        is_bookmarked=is_bookmarked,
        published_at=project.published_at,
        created_at=project.created_at,
    )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    search: Optional[str] = Query(None, description="Search in title, description, domain, or tech"),
    domain: Optional[str] = Query(None, description="Domain filter (e.g. Web Development, AI / Machine Learning)"),
    difficulty: Optional[str] = Query(None, description="Difficulty filter (Beginner, Intermediate, Advanced)"),
    tech: Optional[str] = Query(None, description="Comma-separated or single technology name"),
    duration: Optional[str] = Query(None, description="Estimated duration filter"),
    sort: str = Query("newest", pattern="^(newest|popular|stars|bookmarks|title)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(9, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Public and authenticated project discovery catalog with search,
    multi-faceted filtering, sorting, pagination, and user bookmark status.
    """
    # Base filter: Only published projects for discovery
    base_conditions = [Project.status == "Published"]

    # Domain filtering
    if domain and domain.strip() and domain.strip().lower() != "all":
        base_conditions.append(Project.domain.ilike(f"%{domain.strip()}%"))

    # Difficulty filtering
    if difficulty and difficulty.strip() and difficulty.strip().lower() != "all":
        base_conditions.append(Project.difficulty.ilike(f"%{difficulty.strip()}%"))

    # Duration filtering
    if duration and duration.strip() and duration.strip().lower() != "all":
        dur = duration.strip()
        if "< 2 weeks" in dur or "1-2 weeks" in dur:
            base_conditions.append(or_(
                Project.estimated_duration.ilike("%1%week%"),
                Project.estimated_duration.ilike("%2%week%"),
                Project.estimated_duration.ilike("%< 2%"),
            ))
        elif "2-4 weeks" in dur or "2-3 weeks" in dur or "3-4 weeks" in dur:
            base_conditions.append(or_(
                Project.estimated_duration.ilike("%2-3%"),
                Project.estimated_duration.ilike("%3-4%"),
                Project.estimated_duration.ilike("%2-4%"),
            ))
        elif "4+ weeks" in dur or "> 4 weeks" in dur:
            base_conditions.append(or_(
                Project.estimated_duration.ilike("%4+%"),
                Project.estimated_duration.ilike("%> 4%"),
                Project.estimated_duration.ilike("%5%"),
                Project.estimated_duration.ilike("%6%"),
            ))
        else:
            base_conditions.append(Project.estimated_duration.ilike(f"%{dur}%"))

    # Tech stack filtering
    if tech and tech.strip():
        tech_items = [t.strip() for t in tech.split(",") if t.strip()]
        for t in tech_items:
            base_conditions.append(cast(Project.tech_stack, String).ilike(f"%{t}%"))

    # Keyword search across title, description, domain, and tech_stack
    if search and search.strip():
        term = f"%{search.strip()}%"
        base_conditions.append(
            or_(
                Project.title.ilike(term),
                Project.short_description.ilike(term),
                Project.domain.ilike(term),
                cast(Project.tech_stack, String).ilike(term),
            )
        )

    # Count total matching
    count_stmt = select(func.count(Project.id)).where(*base_conditions)
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Build sorting order
    order_clauses = []
    if sort == "popular":
        order_clauses.extend([desc(Project.views_count), desc(Project.created_at)])
    elif sort == "stars":
        order_clauses.extend([desc(Project.stars_count), desc(Project.created_at)])
    elif sort == "bookmarks":
        order_clauses.extend([desc(Project.bookmarks_count), desc(Project.created_at)])
    elif sort == "title":
        order_clauses.append(asc(Project.title))
    else:  # newest
        order_clauses.extend([desc(Project.published_at), desc(Project.created_at)])

    # Query paginated projects with loaded owner and owner profile
    offset = (page - 1) * limit
    projects_stmt = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile)
        )
        .where(*base_conditions)
        .order_by(*order_clauses)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(projects_stmt)
    projects = result.scalars().all()

    # Determine user bookmarks if authenticated
    user_bookmarked_ids = set()
    if current_user and projects:
        project_ids = [p.id for p in projects]
        bm_stmt = select(ProjectBookmark.project_id).where(
            ProjectBookmark.user_id == current_user.id,
            ProjectBookmark.project_id.in_(project_ids),
        )
        bm_result = await db.execute(bm_stmt)
        user_bookmarked_ids = set(bm_result.scalars().all())

    items = [
        _map_project_to_read(p, is_bookmarked=(p.id in user_bookmarked_ids))
        for p in projects
    ]

    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

    # Compute global facets across published catalog
    all_pub_stmt = select(Project.domain, Project.difficulty, Project.tech_stack).where(
        Project.status == "Published"
    )
    all_pub_res = (await db.execute(all_pub_stmt)).all()

    domain_counts = {}
    difficulty_counts = {}
    tech_set = set()

    for d, diff, stack in all_pub_res:
        if d:
            domain_counts[d] = domain_counts.get(d, 0) + 1
        if diff:
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        if stack and isinstance(stack, list):
            for t in stack:
                if t and isinstance(t, str):
                    tech_set.add(t.strip())

    facets = ProjectFacets(
        domains=[FacetItem(name=k, count=v) for k, v in sorted(domain_counts.items(), key=lambda x: x[0])],
        difficulties=[FacetItem(name=k, count=v) for k, v in sorted(difficulty_counts.items(), key=lambda x: x[0])],
        technologies=sorted(list(tech_set)),
    )

    return ProjectListResponse(
        items=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        facets=facets,
    )


@router.get("/facets", response_model=ProjectFacets)
async def get_project_facets(db: AsyncSession = Depends(get_db)):
    """
    Returns available filter facets (domains, difficulties, technologies)
    for the project discovery catalog.
    """
    all_pub_stmt = select(Project.domain, Project.difficulty, Project.tech_stack).where(
        Project.status == "Published"
    )
    all_pub_res = (await db.execute(all_pub_stmt)).all()

    domain_counts = {}
    difficulty_counts = {}
    tech_set = set()

    for d, diff, stack in all_pub_res:
        if d:
            domain_counts[d] = domain_counts.get(d, 0) + 1
        if diff:
            difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        if stack and isinstance(stack, list):
            for t in stack:
                if t and isinstance(t, str):
                    tech_set.add(t.strip())

    return ProjectFacets(
        domains=[FacetItem(name=k, count=v) for k, v in sorted(domain_counts.items(), key=lambda x: x[0])],
        difficulties=[FacetItem(name=k, count=v) for k, v in sorted(difficulty_counts.items(), key=lambda x: x[0])],
        technologies=sorted(list(tech_set)),
    )


@router.get("/bookmarks/my", response_model=List[ProjectRead])
async def get_my_bookmarked_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all projects bookmarked by the authenticated student.
    """
    stmt = (
        select(Project)
        .join(ProjectBookmark, ProjectBookmark.project_id == Project.id)
        .options(selectinload(Project.owner).selectinload(User.profile))
        .where(
            ProjectBookmark.user_id == current_user.id,
            Project.status == "Published",
        )
        .order_by(desc(ProjectBookmark.created_at))
    )
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return [_map_project_to_read(p, is_bookmarked=True) for p in projects]


@router.get("/my/submissions", response_model=List[ProjectRead])
async def get_my_submitted_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all projects created by the authenticated student across all statuses (Draft, Submitted, Published).
    """
    stmt = (
        select(Project)
        .options(selectinload(Project.owner).selectinload(User.profile))
        .where(Project.owner_id == current_user.id)
        .order_by(desc(Project.created_at))
    )
    res = await db.execute(stmt)
    projects = res.scalars().all()
    return [_map_project_to_read(p, is_bookmarked=False) for p in projects]


@router.post("/upload-zip")
async def upload_standalone_zip(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """
    Validates binary ZIP magic bytes (PK\\x03\\x04), size limits (<= 50MB), uncompressed ratios,
    and security rules for a new project submission draft.
    """
    file_bytes = await file.read()
    inspection = validate_and_inspect_zip(file_bytes, filename=file.filename or "project.zip")
    storage_key, _ = save_zip_archive(
        file_bytes,
        original_filename=file.filename or "project.zip",
        project_identifier=f"draft_{current_user.id.hex[:8]}",
    )
    return {
        "message": "ZIP package verified and stored successfully.",
        "zip_storage_key": storage_key,
        "zip_file_size_bytes": len(file_bytes),
        "filename": file.filename or "project.zip",
        "files_count": inspection["file_count"],
        "uncompressed_size_bytes": inspection["uncompressed_size_bytes"],
    }


@router.post("/{identifier}/bookmark", response_model=BookmarkToggleResponse)
async def toggle_project_bookmark(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Toggles bookmark status of a project for the authenticated user.
    `identifier` can be either the project slug or its UUID.
    """
    # Lookup project by UUID or slug
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
            detail=f"Project '{identifier}' not found.",
        )

    # Check if already bookmarked
    bm_stmt = select(ProjectBookmark).where(
        ProjectBookmark.user_id == current_user.id,
        ProjectBookmark.project_id == project.id,
    )
    existing_bm = (await db.execute(bm_stmt)).scalar_one_or_none()

    if existing_bm:
        await db.delete(existing_bm)
        project.bookmarks_count = max(0, project.bookmarks_count - 1)
        bookmarked = False
        message = "Project removed from bookmarks."
    else:
        new_bm = ProjectBookmark(user_id=current_user.id, project_id=project.id)
        db.add(new_bm)
        project.bookmarks_count += 1
        bookmarked = True
        message = "Project added to bookmarks."

    await db.commit()
    await db.refresh(project)

    return BookmarkToggleResponse(
        project_id=project.id,
        bookmarked=bookmarked,
        bookmarks_count=project.bookmarks_count,
        message=message,
    )


@router.get("/{slug}/download")
async def download_project_zip(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Secure download endpoint for project source archives.
    Verifies published clearance or owner/admin authorization.
    """
    stmt = select(Project).where(Project.slug == slug)
    project = (await db.execute(stmt)).scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with slug '{slug}' was not found.",
        )

    # Permission check for drafts/submissions
    is_owner_or_admin = current_user and (
        current_user.id == project.owner_id or current_user.role == UserRole.ADMIN
    )
    if project.status != "Published" and not is_owner_or_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to download unpublished project archives.",
        )

    if not project.zip_storage_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No source ZIP archive has been uploaded for this project.",
        )

    file_path = get_zip_file_path(project.zip_storage_key)
    if not file_path or not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested archive file is missing or has been relocated.",
        )

    download_filename = f"{project.slug}-source.zip"
    return FileResponse(
        path=str(file_path),
        filename=download_filename,
        media_type="application/zip",
    )


@router.get("/{slug}", response_model=ProjectDetailRead)
async def get_project_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Retrieves full details of a single project by slug.
    Increments view count for published projects.
    """
    stmt = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile),
            selectinload(Project.screenshots_list),
        )
        .where(Project.slug == slug)
    )
    project = (await db.execute(stmt)).scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with slug '{slug}' was not found.",
        )

    # Only published projects or owner / admin can view
    is_owner_or_admin = current_user and (
        current_user.id == project.owner_id or current_user.role == UserRole.ADMIN
    )
    if project.status != "Published" and not is_owner_or_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with slug '{slug}' is not published.",
        )

    # Increment view count
    project.views_count += 1
    await db.commit()
    await db.refresh(project)

    # Check bookmark status
    is_bookmarked = False
    if current_user:
        bm_stmt = select(ProjectBookmark).where(
            ProjectBookmark.user_id == current_user.id,
            ProjectBookmark.project_id == project.id,
        )
        existing_bm = (await db.execute(bm_stmt)).scalar_one_or_none()
        is_bookmarked = existing_bm is not None

    profile_map = {}
    if project.contributors and isinstance(project.contributors, list):
        usernames = [
            c.get("profile_username").lower()
            for c in project.contributors
            if isinstance(c, dict) and c.get("profile_username")
        ]
        if usernames:
            p_stmt = select(Profile).where(Profile.username.in_(usernames))
            p_res = (await db.execute(p_stmt)).scalars().all()
            profile_map = {p.username.lower(): p.avatar_url for p in p_res if p.avatar_url}

    owner_profile = None
    if project.owner and hasattr(project.owner, "profile") and project.owner.profile:
        owner_profile = project.owner.profile
    elif project.owner_id:
        p_stmt = select(Profile).where(Profile.user_id == project.owner_id)
        owner_profile = (await db.execute(p_stmt)).scalar_one_or_none()

    return _map_project_to_detail_read(
        project,
        is_bookmarked=is_bookmarked,
        profile_map=profile_map,
        owner_profile=owner_profile,
    )


@router.post("", response_model=ProjectDetailRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits a new student project or saves a draft.
    Automatically generates a URL-friendly unique slug from the title.
    """
    base_slug = _generate_slug(payload.title)
    candidate_slug = base_slug
    while True:
        stmt = select(Project.id).where(Project.slug == candidate_slug)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if not existing:
            break
        candidate_slug = f"{base_slug}-{secrets.token_hex(2)}"

    screenshots_json = [s.model_dump() for s in payload.screenshots]
    contributors_json = [c.model_dump() for c in payload.contributors]

    new_project = Project(
        owner_id=current_user.id,
        title=payload.title,
        slug=candidate_slug,
        domain=payload.domain,
        short_description=payload.short_description,
        problem_statement=payload.problem_statement,
        objectives=payload.objectives,
        features=payload.features,
        tech_stack=payload.tech_stack,
        prerequisites=payload.prerequisites,
        difficulty=payload.difficulty,
        estimated_duration=payload.estimated_duration,
        expected_outcome=payload.expected_outcome,
        cover_image_url=payload.cover_image_url,
        screenshots=screenshots_json,
        contributors=contributors_json,
        zip_storage_key=payload.zip_storage_key,
        zip_file_size_bytes=payload.zip_file_size_bytes,
        github_url=payload.github_url,
        live_demo_url=payload.live_demo_url,
        video_demo_url=payload.video_demo_url,
        status=payload.status,
    )
    db.add(new_project)
    await db.flush()

    for idx, s in enumerate(payload.screenshots):
        ps = ProjectScreenshot(
            project_id=new_project.id,
            image_url=s.image_url,
            caption=s.caption,
            order_index=s.order_index if s.order_index is not None else idx,
        )
        db.add(ps)

    await db.commit()

    # Re-query with eager loads
    q = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile),
            selectinload(Project.screenshots_list),
        )
        .where(Project.id == new_project.id)
    )
    refreshed = (await db.execute(q)).scalar_one()
    return _map_project_to_detail_read(refreshed, is_bookmarked=False)


@router.put("/{identifier}", response_model=ProjectDetailRead)
async def update_project(
    identifier: str,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Updates an existing draft or submitted project.
    Only the project owner or platform admin is authorized to modify it.
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

    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this project.",
        )

    update_dict = payload.model_dump(exclude_unset=True)

    if "screenshots" in update_dict and payload.screenshots is not None:
        project.screenshots = [s.model_dump() for s in payload.screenshots]
        del_stmt = select(ProjectScreenshot).where(ProjectScreenshot.project_id == project.id)
        existing_shots = (await db.execute(del_stmt)).scalars().all()
        for shot in existing_shots:
            await db.delete(shot)
        await db.flush()

        for idx, s in enumerate(payload.screenshots):
            ps = ProjectScreenshot(
                project_id=project.id,
                image_url=s.image_url,
                caption=s.caption,
                order_index=s.order_index if s.order_index is not None else idx,
            )
            db.add(ps)
        update_dict.pop("screenshots", None)

    if "contributors" in update_dict and payload.contributors is not None:
        project.contributors = [c.model_dump() for c in payload.contributors]
        update_dict.pop("contributors", None)

    for field, val in update_dict.items():
        setattr(project, field, val)

    await db.commit()

    q = (
        select(Project)
        .options(
            selectinload(Project.owner).selectinload(User.profile),
            selectinload(Project.screenshots_list),
        )
        .where(Project.id == project.id)
    )
    refreshed = (await db.execute(q)).scalar_one()

    bm_stmt = select(ProjectBookmark).where(
        ProjectBookmark.user_id == current_user.id,
        ProjectBookmark.project_id == project.id,
    )
    existing_bm = (await db.execute(bm_stmt)).scalar_one_or_none()

    return _map_project_to_detail_read(refreshed, is_bookmarked=(existing_bm is not None))


@router.delete("/{identifier}")
async def delete_project(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Deletes a project draft or submission owned by the authenticated student, or by admin.
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
            detail=f"Project '{identifier}' not found.",
        )

    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this project.",
        )

    # Delete any related bookmarks first
    del_bms = select(ProjectBookmark).where(ProjectBookmark.project_id == project.id)
    bms = (await db.execute(del_bms)).scalars().all()
    for bm in bms:
        await db.delete(bm)

    await db.delete(project)
    await db.commit()

    return {"message": "Project successfully deleted.", "slug": project.slug}


@router.post("/{identifier}/upload-zip")
async def upload_project_zip(
    identifier: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Attaches a validated source code ZIP archive to an existing project.
    Only the project owner or platform admin is authorized.
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

    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to attach files to this project.",
        )

    file_bytes = await file.read()
    inspection = validate_and_inspect_zip(file_bytes, filename=file.filename or "project.zip")
    storage_key, _ = save_zip_archive(
        file_bytes,
        original_filename=file.filename or "project.zip",
        project_identifier=str(project.id),
    )

    project.zip_storage_key = storage_key
    project.zip_file_size_bytes = len(file_bytes)
    await db.commit()
    await db.refresh(project)

    return {
        "message": "Project source archive uploaded successfully.",
        "zip_storage_key": storage_key,
        "zip_file_size_bytes": len(file_bytes),
        "download_url": f"/api/projects/{project.slug}/download",
        "files_count": inspection["file_count"],
    }


@router.get("/{slug}/related", response_model=List[ProjectRead])
async def get_related_projects(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Returns up to 3 related projects in the same domain or difficulty.
    """
    stmt = select(Project).where(Project.slug == slug)
    target = (await db.execute(stmt)).scalar_one_or_none()
    if not target:
        return []

    related_stmt = (
        select(Project)
        .options(selectinload(Project.owner).selectinload(User.profile))
        .where(
            Project.id != target.id,
            Project.status == "Published",
            or_(Project.domain == target.domain, Project.difficulty == target.difficulty),
        )
        .order_by(desc(Project.stars_count))
        .limit(3)
    )
    res = await db.execute(related_stmt)
    related_projects = res.scalars().all()

    user_bms = set()
    if current_user and related_projects:
        bm_res = await db.execute(
            select(ProjectBookmark.project_id).where(
                ProjectBookmark.user_id == current_user.id,
                ProjectBookmark.project_id.in_([p.id for p in related_projects]),
            )
        )
        user_bms = set(bm_res.scalars().all())

    return [_map_project_to_read(p, is_bookmarked=(p.id in user_bms)) for p in related_projects]

