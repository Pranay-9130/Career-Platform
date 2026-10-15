"""Add stable Google account subject identifier.

Revision ID: f4a0b6c10002
Revises: e271dc490001
"""
from alembic import op
import sqlalchemy as sa


revision = "f4a0b6c10002"
down_revision = "e271dc490001"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "google_sub" not in columns:
        op.add_column("users", sa.Column("google_sub", sa.String(length=255), nullable=True))

    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_google_sub" not in indexes:
        op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_google_sub")
        batch_op.drop_column("google_sub")
