"""add contributor user role

Revision ID: d2b3c4a50006
Revises: c1a2e3f40005
"""

from alembic import op
import sqlalchemy as sa


revision = "d2b3c4a50006"
down_revision = "c1a2e3f40005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # UserRole is stored as a portable VARCHAR enum. CONTRIBUTOR is longer
    # than the original values, so production databases need a wider column.
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "role",
            existing_type=sa.String(length=7),
            type_=sa.String(length=11),
            existing_nullable=False,
        )


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'STUDENT' WHERE role = 'CONTRIBUTOR'")
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column(
            "role",
            existing_type=sa.String(length=11),
            type_=sa.String(length=7),
            existing_nullable=False,
        )
