"""align production schema and record missing revision

Revision ID: a1b2c3d40009
Revises: f5b6c7d80008
"""

from alembic import op
import sqlalchemy as sa


revision = "a1b2c3d40009"
down_revision = "f5b6c7d80008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure all job schema additions are idempotently present
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "jobs" in tables:
        columns = {column["name"] for column in inspector.get_columns("jobs")}
        with op.batch_alter_table("jobs") as batch_op:
            if "application_start_date" not in columns:
                batch_op.add_column(
                    sa.Column(
                        "application_start_date",
                        sa.DateTime(timezone=True),
                        nullable=True,
                    )
                )


def downgrade() -> None:
    pass
