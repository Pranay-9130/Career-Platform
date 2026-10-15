"""Add project stars and comments.

Revision ID: b84d2ea40004
Revises: a73c1d9e0003
"""
from alembic import op

from app.models.project_comment import ProjectComment
from app.models.project_star import ProjectStar


revision = "b84d2ea40004"
down_revision = "a73c1d9e0003"
branch_labels = None
depends_on = None


def upgrade():
    ProjectStar.__table__.create(op.get_bind(), checkfirst=True)
    ProjectComment.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    ProjectComment.__table__.drop(op.get_bind(), checkfirst=True)
    ProjectStar.__table__.drop(op.get_bind(), checkfirst=True)
