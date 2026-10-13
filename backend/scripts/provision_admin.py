"""Provision the configured administrator without committing a plaintext password.

Run from backend: py scripts/provision_admin.py
Supply the password interactively, or on stdin for an authorized provisioning run.
"""
import asyncio
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole


async def provision(password: str):
    if len(password) < 8:
        raise ValueError("Administrator password must be at least 8 characters.")
    async with AsyncSessionLocal() as session:
        email = settings.ADMIN_EMAIL.strip().lower()
        admin = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if admin and admin.role != UserRole.ADMIN:
            raise ValueError("Configured admin email belongs to a student; choose another email.")
        if not admin:
            admin = User(email=email, full_name="Pranay", role=UserRole.ADMIN)
            session.add(admin)
        admin.hashed_password = get_password_hash(password)
        admin.is_active = True
        admin.is_verified = True

        demo_accounts = (await session.execute(select(User).where(User.email.in_([
            "student@university.edu", "admin@careerplatform.com",
        ])))).scalars().all()
        for account in demo_accounts:
            account.is_active = False
        await session.commit()
        print("Administrator provisioned successfully.")
        print(f"Legacy demo accounts disabled: {len(demo_accounts)}")


if __name__ == "__main__":
    password = getpass.getpass("Administrator password: ") if sys.stdin.isatty() else sys.stdin.readline().rstrip("\r\n")
    async def run():
        try:
            await provision(password)
        finally:
            await engine.dispose()
    asyncio.run(run())
