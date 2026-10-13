"""Copy legacy project ZIPs from this host into database storage before redeploying.

Run from backend after applying Alembic migrations: py scripts/migrate_archives.py
Existing database archives are left untouched. Original files are retained.
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.models.project import Project
from app.models.stored_archive import StoredArchive
from app.services.zip_service import get_zip_file_path, validate_and_inspect_zip


async def run():
    migrated = missing = 0
    try:
        async with AsyncSessionLocal() as session:
            projects = (await session.execute(select(Project).where(Project.zip_storage_key.is_not(None)))).scalars().all()
            for project in projects:
                if (await session.execute(select(StoredArchive.id).where(
                    StoredArchive.storage_key == project.zip_storage_key
                ))).scalar_one_or_none():
                    continue
                file = get_zip_file_path(project.zip_storage_key)
                if not file:
                    missing += 1
                    continue
                content = file.read_bytes()
                validate_and_inspect_zip(content, file.name)
                session.add(StoredArchive(storage_key=project.zip_storage_key,
                                          owner_id=project.owner_id, content=content))
                migrated += 1
            await session.commit()
        print(f'Archives migrated: {migrated}; missing legacy files: {missing}. Originals retained.')
        if missing:
            raise SystemExit('Missing files must be restored or reuploaded before deployment.')
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(run())
