from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Base Declarative Model
Base = declarative_base()

engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
    "pool_pre_ping": True,
}

if "sqlite" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Managed PostgreSQL connection pool settings for production.
    # Connection budget:
    #   pool_size (15) + max_overflow (15) = 30 max connections per worker process.
    #   With WEB_CONCURRENCY=1 (Render Free 512MB default): max 30 runtime connections.
    #   With WEB_CONCURRENCY=2: max 60 runtime connections (leaves headroom under Neon's
    #   ~100 connection ceiling and PgBouncer session/transaction limits).
    engine_kwargs["pool_size"] = 15
    engine_kwargs["max_overflow"] = 15
    engine_kwargs["pool_recycle"] = 300  # Recycle idle connections before Neon's 5-minute timeout
    engine_kwargs["pool_timeout"] = 15   # Fail-fast timeout to prevent worker backlog during spikes

    connect_args = {
        "command_timeout": 30,
        "server_settings": {
            "application_name": "aspirepath_api",
        },
    }

    # Neon connection pooler (PgBouncer in transaction mode) compatibility:
    # When connecting via a pooler hostname (-pooler) or port 6543, disable asyncpg statement cache
    is_neon_pooler = (
        "-pooler" in settings.DATABASE_URL
        or ":6543" in settings.DATABASE_URL
        or "pooler" in settings.DATABASE_URL.lower()
    )
    if is_neon_pooler:
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_name_func"] = lambda: None

    engine_kwargs["connect_args"] = connect_args

# SQLAlchemy Async Engine
engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an asynchronous database session.
    Automatically closes session on request completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
