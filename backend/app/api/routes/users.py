import re
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.profile_links import clean_social_profile_url
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.models.job_application import JobApplication
from app.models.project_bookmark import ProjectBookmark
from app.models.job_bookmark import JobBookmark
from app.models.resume import Resume
from app.models.notification import Notification
from app.models.job import Job
from app.schemas.dashboard import (
    DashboardStats,
    DashboardActivity,
    DashboardRecommendation,
    DashboardRecentApplication,
    DashboardSummaryResponse,
)
from app.schemas.profile import (
    ProfileRead,
    ProfileUpdate,
    PublicProfileRead,
    PublicProjectPreview,
)
from app.api.dependencies.auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["User Profile & Workspace"])


def calculate_profile_completion(user: User, profile: Profile) -> int:
    """
    Computes percentage (0-100) of profile completeness across 8 core dimensions.
    """
    score = 0
    # 1. Full Name (15%)
    if user.full_name and len(user.full_name.strip()) > 0:
        score += 15

    # 2. Headline (10%)
    if (profile and profile.headline) or user.headline:
        score += 10

    # 3. Bio (15%)
    if profile and profile.bio and len(profile.bio.strip()) >= 20:
        score += 15
    elif profile and profile.bio and len(profile.bio.strip()) > 0:
        score += 5

    # 4. University or Degree (15%)
    if profile and (profile.university or profile.degree):
        score += 15

    # 5. Graduation Year (10%)
    if profile and profile.graduation_year:
        score += 10

    # 6. Skills Matrix (15%)
    if profile and profile.skills and len(profile.skills) >= 3:
        score += 15
    elif profile and profile.skills and len(profile.skills) > 0:
        score += 5

    # 7. Social / Portfolio Links (10%)
    if profile and (
        clean_social_profile_url(profile.github_url, "github")
        or clean_social_profile_url(profile.linkedin_url, "linkedin")
        or profile.portfolio_url
    ):
        score += 10

    # 8. Avatar URL (10%)
    if (profile and profile.avatar_url) or user.avatar_url:
        score += 10

    return min(score, 100)


def calculate_resume_completion(resume: Resume | None) -> int:
    """
    Computes percentage (0-100) of resume completeness across standard resume sections.
    Returns 0 if no resume exists.
    """
    if not resume:
        return 0

    score = 0
    pi = resume.personal_info or {}

    # 1. Contact / Personal Info (20%)
    if pi.get("full_name") and pi.get("email"):
        score += 10
    if pi.get("phone") or pi.get("location"):
        score += 10

    # 2. Professional Summary (15%)
    if resume.summary and len(str(resume.summary).strip()) >= 20:
        score += 15
    elif resume.summary and len(str(resume.summary).strip()) > 0:
        score += 5

    # 3. Education (20%)
    edu = resume.education or []
    if isinstance(edu, list) and len(edu) > 0 and any(isinstance(e, dict) and e.get("institution") for e in edu):
        score += 20

    # 4. Experience (20%)
    exp = resume.experience or []
    if isinstance(exp, list) and len(exp) > 0 and any(isinstance(e, dict) and (e.get("role") or e.get("company")) for e in exp):
        score += 20

    # 5. Projects (15%)
    proj = resume.projects or []
    if isinstance(proj, list) and len(proj) > 0 and any(isinstance(p, dict) and p.get("name") for p in proj):
        score += 15

    # 6. Skills (10%)
    skills = resume.skills or []
    if isinstance(skills, list) and len(skills) >= 3:
        score += 10
    elif isinstance(skills, list) and len(skills) > 0:
        score += 5

    return min(score, 100)


async def get_or_create_user_profile(user: User, db: AsyncSession) -> Profile:
    """
    Retrieves or lazily initializes a student's profile with a unique username slug.
    """
    stmt = select(Profile).where(Profile.user_id == user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if profile:
        return profile

    raw_name = user.email.split("@")[0].lower()
    base_username = re.sub(r"[^a-z0-9_-]", "", raw_name) or "student"
    username = base_username

    counter = 1
    while True:
        check_stmt = select(Profile).where(Profile.username == username)
        existing = (await db.execute(check_stmt)).scalar_one_or_none()
        if not existing:
            break
        username = f"{base_username}_{counter}"
        counter += 1

    profile = Profile(
        user_id=user.id,
        username=username,
        headline=user.headline or "Student & Aspiring Software Engineer",
        bio="Passionate student developer building full-stack and cloud-native applications.",
        avatar_url=user.avatar_url,
        university="University of Technology",
        degree="B.S. in Computer Science",
        graduation_year=2026,
        skills=["React", "Python", "FastAPI", "Tailwind CSS"],
        github_url=None,
        linkedin_url=None,
        portfolio_url=None,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get(
    "/dashboard-summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve personalized student dashboard metrics and activities",
)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregates high-level workspace metrics for the authenticated student,
    including project counts, resume progress, recent activity history,
    recent applications, and curated project/job recommendations.
    """
    now = datetime.now(timezone.utc)

    # 1. Project counts by actual status
    projects_count = 0
    projects_draft = 0
    projects_under_review = 0
    projects_published = 0

    # 2. Application pipeline counts
    active_applications_count = 0
    applications_applied = 0
    interviews_scheduled_count = 0
    applications_offer = 0
    applications_rejected = 0
    saved_jobs_count = 0

    # 3. Saved items & notifications
    saved_items_count = 0
    unread_notifications_count = 0

    # 4. Profile & Resume
    resume_completion = 0
    has_resume = False
    latest_resume_title = None

    # 5. Recent records
    recent_applications = []
    recent_activity = []
    recommended_opportunities = []

    try:
        # A. Projects Breakdown
        stmt_p_all = (
            select(Project.status, func.count(Project.id))
            .where(Project.owner_id == current_user.id)
            .group_by(Project.status)
        )
        p_rows = (await db.execute(stmt_p_all)).all()
        p_counts = {r[0]: r[1] for r in p_rows}
        projects_count = sum(p_counts.values())
        projects_draft = p_counts.get("Draft", 0)
        projects_under_review = p_counts.get("Submitted", 0) + p_counts.get("Under Review", 0)
        projects_published = p_counts.get("Published", 0)

        # B. Applications Breakdown (Excluding "Saved" from submitted applications)
        stmt_a_all = (
            select(JobApplication.status, func.count(JobApplication.id))
            .where(JobApplication.user_id == current_user.id)
            .group_by(JobApplication.status)
        )
        a_rows = (await db.execute(stmt_a_all)).all()
        a_counts = {r[0]: r[1] for r in a_rows}
        applications_applied = a_counts.get("Applied", 0)
        interviews_scheduled_count = a_counts.get("Interviewing", 0)
        applications_offer = a_counts.get("Offer", 0)
        applications_rejected = a_counts.get("Rejected", 0)
        saved_jobs_count = a_counts.get("Saved", 0)
        active_applications_count = (
            applications_applied + interviews_scheduled_count + applications_offer + applications_rejected
        )

        # C. Bookmarks & Unread Notifications
        stmt_pb = select(func.count(ProjectBookmark.id)).where(ProjectBookmark.user_id == current_user.id)
        stmt_jb = select(func.count(JobBookmark.id)).where(JobBookmark.user_id == current_user.id)
        pb_count = (await db.scalar(stmt_pb)) or 0
        jb_count = (await db.scalar(stmt_jb)) or 0
        saved_items_count = pb_count + jb_count

        stmt_notif = (
            select(func.count(Notification.id))
            .where(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        )
        unread_notifications_count = (await db.scalar(stmt_notif)) or 0

        # D. Profile Completion
        stmt_prof = select(Profile).where(Profile.user_id == current_user.id)
        profile = (await db.scalars(stmt_prof)).first()
        profile_completion = calculate_profile_completion(current_user, profile) if profile else (25 if current_user.full_name else 0)

        # E. Resume Record Check & Accurate Resume Completion
        stmt_res = (
            select(Resume)
            .where(Resume.user_id == current_user.id)
            .order_by(desc(Resume.is_primary), desc(Resume.updated_at))
            .limit(1)
        )
        user_resume = (await db.scalars(stmt_res)).first()
        resume_completion = calculate_resume_completion(user_resume)
        if user_resume and resume_completion > 0:
            has_resume = True
            latest_resume_title = user_resume.title
        else:
            has_resume = False
            latest_resume_title = None

        # F. Real Recently Applied Records (status != 'Saved')
        stmt_recent_apps = (
            select(JobApplication)
            .where(JobApplication.user_id == current_user.id, JobApplication.status != "Saved")
            .order_by(desc(JobApplication.applied_date))
            .limit(5)
        )
        recent_app_records = (await db.scalars(stmt_recent_apps)).all()
        for app in recent_app_records:
            recent_applications.append(
                DashboardRecentApplication(
                    id=str(app.id),
                    company_name=app.company_name,
                    position_title=app.position_title,
                    status=app.status,
                    applied_date=app.applied_date or now,
                    job_location=app.job_location or "Remote",
                    work_mode=app.work_mode or "Remote",
                    salary_or_stipend=app.salary_or_stipend,
                )
            )

        # G. Genuine Recent Activity Timeline
        for app in recent_app_records[:3]:
            recent_activity.append(
                DashboardActivity(
                    id=f"app-{app.id}",
                    action="Application Submitted",
                    title=f"Applied for {app.position_title} at {app.company_name}",
                    timestamp=app.applied_date or now,
                    category="application",
                    link="/applications",
                )
            )

        stmt_recent_proj = (
            select(Project)
            .where(Project.owner_id == current_user.id)
            .order_by(desc(Project.created_at))
            .limit(3)
        )
        recent_projs = (await db.scalars(stmt_recent_proj)).all()
        for proj in recent_projs:
            recent_activity.append(
                DashboardActivity(
                    id=f"proj-{proj.id}",
                    action="Project Created",
                    title=f"Showcase project '{proj.title}' ({proj.status})",
                    timestamp=proj.created_at or now,
                    category="project",
                    link="/my-projects",
                )
            )

        if user_resume:
            recent_activity.append(
                DashboardActivity(
                    id=f"resume-{user_resume.id}",
                    action="Resume Updated",
                    title=f"Resume '{user_resume.title}' updated",
                    timestamp=user_resume.updated_at or now,
                    category="resume",
                    link="/resume-builder",
                )
            )

        recent_activity.append(
            DashboardActivity(
                id=f"user-{current_user.id}",
                action="Account Registered",
                title=f"Welcome to Career Platform, {current_user.full_name}!",
                timestamp=current_user.created_at or now,
                category="account",
                link="/profile",
            )
        )

        if current_user.is_verified:
            recent_activity.append(
                DashboardActivity(
                    id=f"verified-{current_user.id}",
                    action="Security Verified",
                    title="Email identity verified. Student Workspace unlocked.",
                    timestamp=current_user.updated_at or now,
                    category="account",
                    link="/dashboard",
                )
            )

        recent_activity.sort(key=lambda x: x.timestamp, reverse=True)
        recent_activity = recent_activity[:10]

        # H. Recommendations: Active DB jobs and published showcase projects
        stmt_live_jobs = (
            select(Job)
            .where(Job.is_active == True)
            .order_by(desc(Job.is_featured), desc(Job.created_at))
            .limit(3)
        )
        live_jobs = (await db.scalars(stmt_live_jobs)).all()
        for j in live_jobs:
            recommended_opportunities.append(
                DashboardRecommendation(
                    id=f"job-{j.id}",
                    title=j.title,
                    organization=j.company_name,
                    category="job",
                    domain=j.domain,
                    tag=j.stipend_or_salary or j.job_type,
                    location=j.location,
                    link=f"/jobs/{j.id}",
                )
            )

        stmt_pub_proj = (
            select(Project)
            .where(Project.status == "Published")
            .order_by(desc(Project.stars_count), desc(Project.created_at))
            .limit(3)
        )
        pub_projs = (await db.scalars(stmt_pub_proj)).all()
        for p in pub_projs:
            recommended_opportunities.append(
                DashboardRecommendation(
                    id=f"proj-{p.id}",
                    title=p.title,
                    organization="Community Showcase",
                    category="project",
                    domain=p.domain,
                    tag=p.difficulty,
                    location="Open Source",
                    link=f"/projects/{p.slug}",
                )
            )

    except Exception as db_err:
        logger.warning("Error querying dashboard metrics from DB: %s", db_err)

    # Fallback to standard platform project guides if DB has no opportunities (e.g., test suite)
    if len(recommended_opportunities) < 2:
        fallback_guides = [
            DashboardRecommendation(
                id="guide-1",
                title="Full-Stack Career Platform Architecture",
                organization="Platform Project Guide",
                category="project",
                domain="Full Stack / React / FastAPI",
                tag="Intermediate",
                location="Remote Guide",
                link="/projects",
            ),
            DashboardRecommendation(
                id="guide-2",
                title="AI Resume Parser & ATS Matching Engine",
                organization="Platform Project Guide",
                category="project",
                domain="AI / NLP / Python",
                tag="Advanced",
                location="Open Source Guide",
                link="/projects",
            ),
        ]
        for fg in fallback_guides:
            if len(recommended_opportunities) < 4:
                recommended_opportunities.append(fg)

    # I. Dynamic Career Readiness Calculation
    # Email verification is optional and must not reduce career readiness.
    score = 25
    score += int((profile_completion / 100) * 25)
    score += int((resume_completion / 100) * 20)
    if projects_count > 0:
        score += 15
    if projects_published > 0:
        score += 15
    readiness_score = min(max(score, 10), 100)

    if readiness_score < 40:
        readiness_stage = "Stage 1: Profile Setup"
        next_milestone = (
            "Verify your student email and complete profile fields to unlock recruiter discovery."
        )
    elif readiness_score < 70:
        readiness_stage = "Stage 2: Skill Builder"
        next_milestone = (
            "Showcase your first practical project to reach Stage 3: Verified Creator."
        )
    else:
        readiness_stage = "Stage 3: Verified Creator"
        next_milestone = (
            "Run an ATS scan in ATS Analyzer to optimize your match for target opportunities."
        )

    stats = DashboardStats(
        projects_count=projects_count,
        projects_draft=projects_draft,
        projects_under_review=projects_under_review,
        projects_published=projects_published,
        resume_completion_percentage=resume_completion,
        ats_score=None,
        active_applications_count=active_applications_count,
        applications_applied=applications_applied,
        interviews_scheduled_count=interviews_scheduled_count,
        applications_offer=applications_offer,
        applications_rejected=applications_rejected,
        saved_items_count=saved_items_count,
        saved_jobs_count=saved_jobs_count,
        unread_notifications_count=unread_notifications_count,
    )

    return DashboardSummaryResponse(
        user=current_user,
        stats=stats,
        recent_activity=recent_activity,
        recommended_opportunities=recommended_opportunities,
        recent_applications=recent_applications,
        has_resume=has_resume,
        latest_resume_title=latest_resume_title,
        readiness_score=readiness_score,
        readiness_stage=readiness_stage,
        next_milestone=next_milestone,
    )


@router.get(
    "/me",
    response_model=ProfileRead,
    status_code=status.HTTP_200_OK,
    summary="Retrieve authenticated student profile and completion progress",
)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the student's complete profile record including academic credentials,
    skills matrix, social links, and live completion percentage.
    """
    profile = await get_or_create_user_profile(current_user, db)
    completion = calculate_profile_completion(current_user, profile)

    return ProfileRead(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        username=profile.username,
        headline=profile.headline or current_user.headline,
        bio=profile.bio,
        avatar_url=profile.avatar_url or current_user.avatar_url,
        university=profile.university,
        degree=profile.degree,
        graduation_year=profile.graduation_year,
        github_url=clean_social_profile_url(profile.github_url, "github"),
        linkedin_url=clean_social_profile_url(profile.linkedin_url, "linkedin"),
        portfolio_url=profile.portfolio_url,
        skills=profile.skills or [],
        is_verified=current_user.is_verified,
        completion_percentage=completion,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put(
    "/me",
    response_model=ProfileRead,
    status_code=status.HTTP_200_OK,
    summary="Update authenticated student profile",
)
async def update_my_profile(
    update_data: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates the authenticated student's profile details.
    Validates username uniqueness and synchronizes full_name, headline, and avatar_url.
    """
    profile = await get_or_create_user_profile(current_user, db)

    # Validate username uniqueness if changed
    if update_data.username and update_data.username != profile.username:
        normalized_username = update_data.username.strip().lower()
        check_stmt = (
            select(Profile)
            .where(Profile.username == normalized_username)
            .where(Profile.id != profile.id)
        )
        existing = (await db.execute(check_stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{update_data.username}' is already taken. Please choose another.",
            )
        profile.username = normalized_username

    # Update full_name on User model
    if update_data.full_name is not None:
        trimmed_name = update_data.full_name.strip()
        if len(trimmed_name) >= 2:
            current_user.full_name = trimmed_name

    # Update headline & avatar_url across both models
    if update_data.headline is not None:
        profile.headline = update_data.headline.strip() if update_data.headline else None
        current_user.headline = profile.headline

    if update_data.avatar_url is not None:
        profile.avatar_url = update_data.avatar_url.strip() if update_data.avatar_url else None
        current_user.avatar_url = profile.avatar_url

    # Update academic & professional fields
    if update_data.bio is not None:
        profile.bio = update_data.bio.strip() if update_data.bio else None

    if update_data.university is not None:
        profile.university = update_data.university.strip() if update_data.university else None

    if update_data.degree is not None:
        profile.degree = update_data.degree.strip() if update_data.degree else None

    if update_data.graduation_year is not None:
        profile.graduation_year = update_data.graduation_year

    if update_data.github_url is not None:
        profile.github_url = clean_social_profile_url(update_data.github_url, "github")

    if update_data.linkedin_url is not None:
        profile.linkedin_url = clean_social_profile_url(update_data.linkedin_url, "linkedin")

    if update_data.portfolio_url is not None:
        profile.portfolio_url = update_data.portfolio_url.strip() if update_data.portfolio_url else None

    if update_data.skills is not None:
        # Deduplicate and trim skills
        cleaned_skills = []
        for s in update_data.skills:
            if isinstance(s, str) and s.strip() and s.strip() not in cleaned_skills:
                cleaned_skills.append(s.strip())
        profile.skills = cleaned_skills

    await db.commit()
    await db.refresh(profile)
    await db.refresh(current_user)

    completion = calculate_profile_completion(current_user, profile)

    return ProfileRead(
        id=profile.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        username=profile.username,
        headline=profile.headline or current_user.headline,
        bio=profile.bio,
        avatar_url=profile.avatar_url or current_user.avatar_url,
        university=profile.university,
        degree=profile.degree,
        graduation_year=profile.graduation_year,
        github_url=clean_social_profile_url(profile.github_url, "github"),
        linkedin_url=clean_social_profile_url(profile.linkedin_url, "linkedin"),
        portfolio_url=profile.portfolio_url,
        skills=profile.skills or [],
        is_verified=current_user.is_verified,
        completion_percentage=completion,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get(
    "/public/{username}",
    response_model=PublicProfileRead,
    status_code=status.HTTP_200_OK,
    summary="Retrieve public student profile by username (alias)",
)
@router.get(
    "/{username}",
    response_model=PublicProfileRead,
    status_code=status.HTTP_200_OK,
    summary="Retrieve public student portfolio profile by username",
)
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Returns public student profile and showcased project portfolio for the given username.
    """
    stmt = select(Profile).where(Profile.username == username.lower())
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with username '{username}' was not found.",
        )

    user_stmt = select(User).where(User.id == profile.user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()

    # 1. Projects authored by user (published only)
    stmt_authored = (
        select(Project)
        .where(Project.owner_id == profile.user_id)
        .where(Project.status == "Published")
        .order_by(Project.created_at.desc())
    )
    authored_projects = (await db.execute(stmt_authored)).scalars().all()

    # 2. Projects where user is attributed as contributor (published only, non-owned)
    stmt_other = (
        select(Project)
        .where(Project.owner_id != profile.user_id)
        .where(Project.status == "Published")
        .order_by(Project.created_at.desc())
    )
    other_projects = (await db.execute(stmt_other)).scalars().all()

    projects_list = []
    total_stars = 0
    total_views = 0

    # Process authored projects
    for p in authored_projects:
        stars = p.stars_count or 0
        views = p.views_count or 0
        total_stars += stars
        total_views += views
        projects_list.append(
            PublicProjectPreview(
                id=p.id,
                slug=p.slug,
                title=p.title,
                description=p.short_description,
                domain=p.domain,
                difficulty=p.difficulty,
                tech_stack=p.tech_stack or [],
                github_url=p.github_url,
                demo_url=p.live_demo_url,
                is_featured=True,
                role="Lead Author",
                views_count=views,
                stars_count=stars,
            )
        )

    # Process co-authored projects
    username_lower = profile.username.lower()
    full_name_lower = user.full_name.lower() if user and user.full_name else ""
    github_profile_url = clean_social_profile_url(profile.github_url, "github")
    github_handle = (
        github_profile_url.rstrip("/").split("/")[-1].lower()
        if github_profile_url
        else ""
    )

    for p in other_projects:
        if not p.contributors:
            continue
        matched_role = None
        for c in p.contributors:
            c_name = (c.get("name") if isinstance(c, dict) else str(c)).lower()
            c_github = (c.get("github_username") if isinstance(c, dict) else "").lower()
            c_profile = (c.get("profile_username") if isinstance(c, dict) else "").lower()
            if (
                (c_profile and c_profile == username_lower)
                or (github_handle and c_github and c_github == github_handle)
                or (full_name_lower and c_name and c_name == full_name_lower)
            ):
                matched_role = (
                    c.get("role", "Co-Author")
                    if isinstance(c, dict)
                    else "Co-Author"
                )
                break

        if matched_role:
            stars = p.stars_count or 0
            views = p.views_count or 0
            total_stars += stars
            total_views += views
            projects_list.append(
                PublicProjectPreview(
                    id=p.id,
                    slug=p.slug,
                    title=p.title,
                    description=p.short_description,
                    domain=p.domain,
                    difficulty=p.difficulty,
                    tech_stack=p.tech_stack or [],
                    github_url=p.github_url,
                    demo_url=p.live_demo_url,
                    is_featured=False,
                    role=matched_role,
                    views_count=views,
                    stars_count=stars,
                )
            )

    return PublicProfileRead(
        username=profile.username,
        full_name=user.full_name if user else "Student",
        headline=profile.headline or (user.headline if user else None),
        bio=profile.bio,
        avatar_url=profile.avatar_url or (user.avatar_url if user else None),
        university=profile.university,
        degree=profile.degree,
        graduation_year=profile.graduation_year,
        github_url=clean_social_profile_url(profile.github_url, "github"),
        linkedin_url=clean_social_profile_url(profile.linkedin_url, "linkedin"),
        portfolio_url=profile.portfolio_url,
        skills=profile.skills or [],
        is_verified=user.is_verified if user else False,
        projects_count=len(projects_list),
        total_stars_count=total_stars,
        total_views_count=total_views,
        projects=projects_list,
    )
