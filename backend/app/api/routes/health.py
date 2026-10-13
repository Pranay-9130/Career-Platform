from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get('/ready')
async def readiness(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text('SELECT 1 FROM auth_sessions LIMIT 1'))
        await db.execute(text('SELECT 1 FROM stored_archives LIMIT 1'))
    except Exception:
        raise HTTPException(status_code=503, detail='Database or migrations are not ready.')
    return {'status': 'ready'}

@router.get("")
async def health_check():
    """
    Health check endpoint for container orchestrators and monitoring tools.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
    }
