"""Container entry point: migrate the database, then serve API and frontend."""
import os
import subprocess
import sys
from pathlib import Path

from alembic.script.revision import ResolutionError
from alembic.util.exc import CommandError
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
try:
    from scripts.validate_migrations import validate_database_revisions, validate_migration_graph
except ImportError:
    from validate_migrations import validate_database_revisions, validate_migration_graph

run_startup_migrations = os.getenv("RUN_MIGRATIONS_ON_STARTUP", "true").strip().lower() in {
    "1", "true", "yes", "on"
}

if run_startup_migrations:
    sync_url = settings.SYNC_DATABASE_URL
    is_pooler = "-pooler" in sync_url or ":6543" in sync_url or "pooler" in sync_url.lower()
    if is_pooler:
        print(
            "ERROR: Refusing to run Alembic migrations against a Neon/PgBouncer pooler URL. "
            "Set SYNC_DATABASE_URL to the direct PostgreSQL connection string or set "
            "RUN_MIGRATIONS_ON_STARTUP=false and run migrations as a separate staging/release step.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    try:
        validate_migration_graph()
        engine = create_engine(sync_url)
        try:
            with engine.connect() as connection:
                validate_database_revisions(connection)
        finally:
            engine.dispose()
        subprocess.run([sys.executable, '-m', 'alembic', 'upgrade', 'head'], check=True)
    except (
        CommandError,
        ResolutionError,
        RuntimeError,
        SQLAlchemyError,
        subprocess.CalledProcessError,
    ) as error:
        print(
            "ERROR: Database migration validation or upgrade failed; the API was not started. "
            f"Details: {error}",
            file=sys.stderr,
        )
        print("No database reset or alembic_version stamp was performed.", file=sys.stderr)
        raise SystemExit(1) from error

workers_count = os.getenv("WEB_CONCURRENCY", "1")
os.execvp(sys.executable, [
    sys.executable, '-m', 'uvicorn', 'app.main:app',
    '--host', '0.0.0.0', '--port', os.getenv('PORT', '8000'), '--workers', str(workers_count),
])
