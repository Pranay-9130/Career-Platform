"""add feature announcements and user tracking tables

Revision ID: d0e1f2a30018
Revises: c0d1e2f30017
"""
from alembic import op
import sqlalchemy as sa
from app.models.announcement import FeatureAnnouncement, UserAnnouncementTracking

revision = "d0e1f2a30018"
down_revision = "c0d1e2f30017"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    FeatureAnnouncement.__table__.create(bind, checkfirst=True)
    UserAnnouncementTracking.__table__.create(bind, checkfirst=True)


def downgrade():
    bind = op.get_bind()
    UserAnnouncementTracking.__table__.drop(bind, checkfirst=True)
    FeatureAnnouncement.__table__.drop(bind, checkfirst=True)
