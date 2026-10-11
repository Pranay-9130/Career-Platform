from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.project import Project
from app.models.job import Job

router = APIRouter(tags=["SEO & Sitemaps"])


def _format_date(dt: datetime | None) -> str:
    if not dt:
        dt = datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%d")


async def generate_sitemap_xml(db: AsyncSession, base_url: str) -> str:
    """
    Builds an XML sitemap complying with the sitemaps.org protocol,
    dynamically incorporating all published projects and active jobs.
    """
    # 1. Fetch published projects only
    stmt_projects = (
        select(Project.slug, Project.updated_at, Project.created_at)
        .where(Project.status == "Published")
        .order_by(Project.created_at.desc())
    )
    projects_res = await db.execute(stmt_projects)
    published_projects = projects_res.all()

    # 2. Fetch active jobs only
    stmt_jobs = (
        select(Job.id, Job.updated_at, Job.created_at)
        .where(Job.is_active.is_(True))
        .order_by(Job.created_at.desc())
    )
    jobs_res = await db.execute(stmt_jobs)
    active_jobs = jobs_res.all()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Static high-priority indexable routes
    static_routes = [
        {"path": "", "priority": "1.0", "changefreq": "daily"},
        {"path": "/projects", "priority": "0.9", "changefreq": "daily"},
        {"path": "/jobs", "priority": "0.9", "changefreq": "daily"},
        {"path": "/ats-analyzer", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/resumes", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/about", "priority": "0.6", "changefreq": "monthly"},
        {"path": "/contact", "priority": "0.6", "changefreq": "monthly"},
    ]

    urls_xml = []

    # Add static routes
    for item in static_routes:
        loc = f"{base_url}{item['path']}"
        urls_xml.append(
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{today_str}</lastmod>\n"
            f"    <changefreq>{item['changefreq']}</changefreq>\n"
            f"    <priority>{item['priority']}</priority>\n"
            f"  </url>"
        )

    # Add published projects
    for proj in published_projects:
        loc = f"{base_url}/projects/{proj.slug}"
        mod_date = _format_date(proj.updated_at or proj.created_at)
        urls_xml.append(
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{mod_date}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>0.8</priority>\n"
            f"  </url>"
        )

    # Add active jobs
    for job in active_jobs:
        loc = f"{base_url}/jobs/{job.id}"
        mod_date = _format_date(job.updated_at or job.created_at)
        urls_xml.append(
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{mod_date}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>0.8</priority>\n"
            f"  </url>"
        )

    xml_content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls_xml)
        + "\n</urlset>"
    )
    return xml_content


def generate_robots_txt(base_url: str) -> str:
    """
    Builds standard robots.txt permitting public crawling of project showcases
    and jobs while excluding sensitive internal user workspaces and dashboards.
    """
    return (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin/\n"
        "Disallow: /resumes/builder/\n"
        "Disallow: /dashboard\n"
        "Disallow: /workspace\n"
        "Disallow: /settings\n"
        "Disallow: /api/\n\n"
        f"Sitemap: {base_url}/sitemap.xml\n"
    )


@router.get("/sitemap.xml", response_class=Response)
async def sitemap_endpoint(db: AsyncSession = Depends(get_db)):
    """
    Generates and returns an XML sitemap of all public platform pages.
    """
    base_url = settings.FRONTEND_URL.rstrip("/")
    xml_data = await generate_sitemap_xml(db, base_url)
    return Response(content=xml_data, media_type="application/xml")


@router.get("/robots.txt", response_class=Response)
async def robots_endpoint():
    """
    Returns search crawler guidance with canonical sitemap reference.
    """
    base_url = settings.FRONTEND_URL.rstrip("/")
    content = generate_robots_txt(base_url)
    return Response(content=content, media_type="text/plain")
