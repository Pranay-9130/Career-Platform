"""Add persistent project image uploads.

Revision ID: a73c1d9e0003
Revises: f4a0b6c10002
"""
from alembic import op

from app.models.stored_image import StoredImage


revision = "a73c1d9e0003"
down_revision = "f4a0b6c10002"
branch_labels = None
depends_on = None


def upgrade():
    StoredImage.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    StoredImage.__table__.drop(op.get_bind(), checkfirst=True)
