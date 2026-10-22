"""add job application start date

Revision ID: f5b6c7d80008
Revises: e3f4a5b60007
"""

from alembic import op
import sqlalchemy as sa


revision = "f5b6c7d80008"
down_revision = "e3f4a5b60007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(
            sa.Column("application_start_date", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_column("application_start_date")
