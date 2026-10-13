"""Add persistent authentication sessions and uploaded archives.

Revision ID: e271dc490001
Revises: c954d87ff7a3
"""
from alembic import op
from app.models.auth_session import AuthSession
from app.models.stored_archive import StoredArchive

revision = "e271dc490001"
down_revision = "c954d87ff7a3"
branch_labels = None
depends_on = None


def upgrade():
    # The original initial migration creates metadata dynamically, so fresh
    # installs may already contain these tables. Existing installations do not.
    AuthSession.__table__.create(op.get_bind(), checkfirst=True)
    StoredArchive.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    StoredArchive.__table__.drop(op.get_bind(), checkfirst=True)
    AuthSession.__table__.drop(op.get_bind(), checkfirst=True)
