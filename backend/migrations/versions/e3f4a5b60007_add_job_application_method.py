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
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(
            sa.Column(
                "application_method",
                sa.String(length=50),
                nullable=False,
                server_default="INTERNAL",
            )
        )
        batch_op.add_column(
            sa.Column("application_url", sa.String(length=500), nullable=True)
        )
        batch_op.add_column(
            sa.Column("recruiter_email", sa.String(length=255), nullable=True)
        )
        batch_op.add_column(
            sa.Column("application_instructions", sa.Text(), nullable=True)
        )
        batch_op.alter_column(
            "apply_url",
            existing_type=sa.String(length=500),
            nullable=True,
        )
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
