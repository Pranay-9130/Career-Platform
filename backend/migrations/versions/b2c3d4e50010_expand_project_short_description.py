"""expand project short_description to Text

Revision ID: b2c3d4e50010
Revises: a1b2c3d40009
"""

from alembic import op
import sqlalchemy as sa


revision = "b2c3d4e50010"
down_revision = "a1b2c3d40009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "projects" in tables:
        with op.batch_alter_table("projects") as batch_op:
            batch_op.alter_column(
                "short_description",
                existing_type=sa.String(length=300),
                type_=sa.Text(),
                existing_nullable=False,
                nullable=False,
            )


def downgrade() -> None:
    pass
