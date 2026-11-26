"""add student career discoveries table

Revision ID: c0d1e2f30017
Revises: b9c0d1e20016
"""
from alembic import op
import sqlalchemy as sa
from app.models.career_discovery import StudentCareerDiscovery

revision = "c0d1e2f30017"
down_revision = "b9c0d1e20016"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    StudentCareerDiscovery.__table__.create(bind, checkfirst=True)


def downgrade():
    bind = op.get_bind()
    StudentCareerDiscovery.__table__.drop(bind, checkfirst=True)
