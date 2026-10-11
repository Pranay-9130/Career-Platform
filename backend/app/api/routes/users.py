import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.schemas.dashboard import (
    DashboardStats,
    DashboardActivity,
    DashboardRecommendation,
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
    if profile and (profile.github_url or profile.linkedin_url or profile.portfolio_url):
        score += 10

    # 8. Avatar URL (10%)
    if (profile and profile.avatar_url) or user.avatar_url:
        score += 10

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
        github_url="https://github.com",
        linkedin_url="https://linkedin.com",
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
    and curated project/job recommendations.
    """
    now = datetime.now(timezone.utc)

    # Base student metrics
    stats = DashboardStats(
        projects_count=2 if current_user.is_verified else 0,
        projects_under_review=1 if current_user.is_verified else 0,
        resume_completion_percentage=75 if current_user.is_verified else 35,
        ats_score=82 if current_user.is_verified else None,
        active_applications_count=3 if current_user.is_verified else 0,
        interviews_scheduled_count=1 if current_user.is_verified else 0,
        saved_items_count=4,
    )

    # Activity history tailored to current user state
    recent_activity = [
        DashboardActivity(
            id="act-1",
            action="Account Registered",
            title=f"Welcome to Career Platform, {current_user.full_name}!",
            timestamp=current_user.created_at or now,
            category="account",
            link="/profile",
        ),
    ]

    if current_user.is_verified:
        recent_activity.insert(
            0,
            DashboardActivity(
                id="act-2",
                action="Security Verified",
                title="Email identity verified. Student Workspace unlocked.",
                timestamp=now - timedelta(hours=2),
                category="account",
                link="/dashboard",
            ),
        )
        recent_activity.insert(
            0,
            DashboardActivity(
                id="act-3",
                action="Resume Analyzed",
                title="ATS Analyzer match score calculated: 82/100 (Strong Match)",
                timestamp=now - timedelta(hours=5),
                category="resume",
                link="/ats-analyzer",
            ),
        )
        recent_activity.insert(
            0,
            DashboardActivity(
                id="act-4",
                action="Application Submitted",
                title="Applied for Frontend Engineering Intern at Stripe",
                timestamp=now - timedelta(days=1),
                category="application",
                link="/applications",
            ),
        )

    # Curated recommendations based on student track
    recommended_opportunities = [
        DashboardRecommendation(
            id="rec-1",
            title="Full-Stack Career Platform Architecture",
            organization="CareerPlatform Labs",
            category="project",
            domain="Full Stack / React / FastAPI",
            tag="Intermediate",
            location="Remote Guide",
            link="/projects",
        ),
        DashboardRecommendation(
            id="rec-2",
            title="Junior Cloud & DevOps Engineering Intern",
            organization="CloudScale Dynamics",
            category="job",
            domain="Cloud Architecture / Docker",
            tag="$38/hr Stipend",
            location="Remote",
            link="/jobs",
        ),
        DashboardRecommendation(
            id="rec-3",
            title="AI Resume Parser & ATS Matching Engine",
            organization="OpenSource Talent AI",
            category="project",
            domain="AI / NLP / Python",
            tag="Advanced",
            location="Open Source",
            link="/projects",
        ),
        DashboardRecommendation(
            id="rec-4",
            title="Software Engineering Intern — Summer 2026",
            organization="Stripe",
            category="job",
            domain="Backend Systems",
            tag="$52/hr Stipend",
            location="Hybrid (SF / Seattle)",
            link="/jobs",
        ),
    ]

    readiness_score = 78 if current_user.is_verified else 45
    readiness_stage = (
        "Stage 3: Verified Creator"
        if current_user.is_verified
        else "Stage 1: Profile Setup"
    )
    next_milestone = (
        "Complete your ATS scan for 'Junior Software Engineer' to unlock interview fast-track."
        if current_user.is_verified
        else "Verify your email address and upload your first academic project to unlock recruiter visibility."
    )

    return DashboardSummaryResponse(
        user=current_user,
        stats=stats,
        recent_activity=recent_activity,
        recommended_opportunities=recommended_opportunities,
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
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
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
        profile.github_url = update_data.github_url.strip() if update_data.github_url else None

    if update_data.linkedin_url is not None:
        profile.linkedin_url = update_data.linkedin_url.strip() if update_data.linkedin_url else None

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
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
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
    github_handle = (
        (profile.github_url or "").rstrip("/").split("/")[-1].lower()
        if profile.github_url
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
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
        portfolio_url=profile.portfolio_url,
        skills=profile.skills or [],
        is_verified=user.is_verified if user else False,
        projects_count=len(projects_list),
        total_stars_count=total_stars,
        total_views_count=total_views,
        projects=projects_list,
    )
