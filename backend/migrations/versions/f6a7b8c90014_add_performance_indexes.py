"""add performance indexes for high-concurrency queries

Revision ID: f6a7b8c90014
Revises: e5f6a7b80013
"""

from alembic import op
import sqlalchemy as sa


revision = "f6a7b8c90014"
down_revision = "e5f6a7b80013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    # 1. Composite index for jobs discovery: WHERE is_active = true ORDER BY is_featured DESC, created_at DESC
    if "jobs" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("jobs")}
        if "ix_jobs_active_featured_created" not in existing_indexes:
            with op.batch_alter_table("jobs") as batch_op:
                batch_op.create_index(
                    "ix_jobs_active_featured_created",
                    ["is_active", "is_featured", "created_at"],
                    unique=False,
                )

    # 2. Composite index for project discovery: WHERE status = 'Published' ORDER BY published_at DESC, created_at DESC
    if "projects" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("projects")}
        if "ix_projects_status_pub_created" not in existing_indexes:
            with op.batch_alter_table("projects") as batch_op:
                batch_op.create_index(
                    "ix_projects_status_pub_created",
                    ["status", "published_at", "created_at"],
                    unique=False,
                )

    # 3. Composite index for application tracking & dashboard pipeline: WHERE user_id = :uid AND status != 'Saved' ORDER BY applied_date DESC
    if "job_applications" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("job_applications")}
        if "ix_job_apps_user_status_applied" not in existing_indexes:
            with op.batch_alter_table("job_applications") as batch_op:
                batch_op.create_index(
                    "ix_job_apps_user_status_applied",
                    ["user_id", "status", "applied_date"],
                    unique=False,
                )

    # 4. Composite index for resume lookup: WHERE user_id = :uid ORDER BY is_primary DESC, updated_at DESC
    if "resumes" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("resumes")}
        if "ix_resumes_user_primary_updated" not in existing_indexes:
            with op.batch_alter_table("resumes") as batch_op:
                batch_op.create_index(
                    "ix_resumes_user_primary_updated",
                    ["user_id", "is_primary", "updated_at"],
                    unique=False,
                )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "resumes" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("resumes")}
        if "ix_resumes_user_primary_updated" in existing_indexes:
            with op.batch_alter_table("resumes") as batch_op:
                batch_op.drop_index("ix_resumes_user_primary_updated")

    if "job_applications" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("job_applications")}
        if "ix_job_apps_user_status_applied" in existing_indexes:
            with op.batch_alter_table("job_applications") as batch_op:
                batch_op.drop_index("ix_job_apps_user_status_applied")

    if "projects" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("projects")}
        if "ix_projects_status_pub_created" in existing_indexes:
            with op.batch_alter_table("projects") as batch_op:
                batch_op.drop_index("ix_projects_status_pub_created")

    if "jobs" in tables:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("jobs")}
        if "ix_jobs_active_featured_created" in existing_indexes:
            with op.batch_alter_table("jobs") as batch_op:
                batch_op.drop_index("ix_jobs_active_featured_created")

