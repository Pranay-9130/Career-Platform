"""add job experience requirements field

Revision ID: e5f6a7b80013
Revises: d4e5f6a70012
"""

from alembic import op
import sqlalchemy as sa


revision = "e5f6a7b80013"
down_revision = "d4e5f6a70012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "jobs" in tables:
        columns = {column["name"]: column for column in inspector.get_columns("jobs")}
        if "experience_requirements" not in columns:
            with op.batch_alter_table("jobs") as batch_op:
                batch_op.add_column(
                    sa.Column(
                        "experience_requirements",
                        sa.String(length=100),
                        nullable=True,
                    )
                )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "jobs" in tables:
        columns = {column["name"]: column for column in inspector.get_columns("jobs")}
        if "experience_requirements" in columns:
            with op.batch_alter_table("jobs") as batch_op:
                batch_op.drop_column("experience_requirements")
