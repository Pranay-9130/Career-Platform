import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.api.routes import api_router
from app.core.config import Settings, settings
from app.core.frontend import FrontendFiles
from app.models.user import User
from app.models.job import Job
from app.main import app


@pytest.mark.asyncio
async def test_single_origin_serves_spa_and_does_not_mask_api_errors(tmp_path):
    (tmp_path / 'index.html').write_text('<html>career platform</html>', encoding='utf-8')
    (tmp_path / 'assets').mkdir()
    (tmp_path / 'assets' / 'app.js').write_text('console.log("ready")', encoding='utf-8')
    site = FastAPI()
    site.include_router(api_router)
    site.mount('/', FrontendFiles(directory=tmp_path, html=True))
    async with AsyncClient(transport=ASGITransport(app=site), base_url='https://site.test') as client:
        for page in ('/', '/login', '/dashboard', '/admin/dashboard', '/projects/sample'):
            response = await client.get(page)
            assert response.status_code == 200
            assert 'career platform' in response.text
        assert (await client.get('/assets/app.js')).status_code == 200
        assert (await client.get('/assets/missing.js')).status_code == 404
        assert (await client.get('/api/not-a-route')).status_code == 404
        assert (await client.get('/api/health')).json()['status'] == 'healthy'
        config = (await client.get('/api/auth/config')).json()
        assert config == {'google_client_id': settings.GOOGLE_CLIENT_ID}


def test_render_supplies_same_origin_urls_without_separate_frontend_settings():
    configured = Settings(_env_file=None, RENDER_EXTERNAL_URL='https://career-platform.onrender.com')
    assert configured.FRONTEND_URL == 'https://career-platform.onrender.com'
    assert configured.FRONTEND_URL in configured.ALLOWED_ORIGINS


@pytest.mark.asyncio
async def test_production_startup_does_not_seed_demo_accounts_or_jobs(monkeypatch):
    from app.core import database
    engine = create_async_engine('sqlite+aiosqlite:///:memory:')
    monkeypatch.setattr(database, 'engine', engine)
    monkeypatch.setattr(database, 'AsyncSessionLocal', async_sessionmaker(engine, expire_on_commit=False))
    monkeypatch.setattr(settings, 'ENVIRONMENT', 'production')
    try:
        async with app.router.lifespan_context(app):
            async with database.AsyncSessionLocal() as session:
                assert await session.scalar(select(func.count(User.id))) == 0
                assert await session.scalar(select(func.count(Job.id))) == 0
            async with AsyncClient(transport=ASGITransport(app=app), base_url='https://site.test') as client:
                response = await client.get('/api/health/ready')
                assert response.status_code == 200
                assert response.json()['status'] == 'ready'
    finally:
        await engine.dispose()
