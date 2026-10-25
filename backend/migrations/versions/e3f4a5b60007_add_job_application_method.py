"""add job application method settings

Revision ID: e3f4a5b60007
Revises: d2b3c4a50006
"""

from alembic import op
import sqlalchemy as sa


revision = "e3f4a5b60007"
down_revision = "d2b3c4a50006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("jobs")}
    indexes = {index["name"] for index in inspector.get_indexes("jobs")}

    with op.batch_alter_table("jobs") as batch_op:
        if "application_method" not in columns:
            batch_op.add_column(
                sa.Column(
                    "application_method",
                    sa.String(length=50),
                    nullable=False,
                    server_default="INTERNAL",
                )
            )
        if "application_url" not in columns:
            batch_op.add_column(sa.Column("application_url", sa.String(length=500), nullable=True))
        if "recruiter_email" not in columns:
            batch_op.add_column(sa.Column("recruiter_email", sa.String(length=255), nullable=True))
        if "application_instructions" not in columns:
            batch_op.add_column(sa.Column("application_instructions", sa.Text(), nullable=True))
        if "apply_url" in columns and not columns["apply_url"]["nullable"]:
            batch_op.alter_column(
                "apply_url",
                existing_type=sa.String(length=500),
                nullable=True,
            )
        if "ix_jobs_application_method" not in indexes:
            batch_op.create_index(
                "ix_jobs_application_method",
                ["application_method"],
                unique=False,
            )


def downgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_index("ix_jobs_application_method")
        batch_op.alter_column(
            "apply_url",
            existing_type=sa.String(length=500),
            nullable=False,
        )
        batch_op.drop_column("application_instructions")
        batch_op.drop_column("recruiter_email")
        batch_op.drop_column("application_url")
        batch_op.drop_column("application_method")
