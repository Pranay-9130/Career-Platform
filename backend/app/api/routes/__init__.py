from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.contact import router as contact_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.projects import router as projects_router
from app.api.routes.admin import router as admin_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.applications import router as applications_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.seo import router as seo_router
from app.api.routes.skill_intelligence import router as skill_intelligence_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(contact_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(projects_router)
api_router.include_router(admin_router)
api_router.include_router(jobs_router)
api_router.include_router(applications_router)
api_router.include_router(notifications_router)
api_router.include_router(resumes_router)
api_router.include_router(seo_router)
api_router.include_router(skill_intelligence_router)

__all__ = ["api_router"]

