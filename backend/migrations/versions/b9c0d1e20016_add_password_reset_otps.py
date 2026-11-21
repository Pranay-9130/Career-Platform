"""add password reset otps table for secure email otp workflow

Revision ID: b9c0d1e20016
Revises: a8b9c0d10015
"""
from alembic import op
import sqlalchemy as sa
from app.models.password_reset import PasswordResetOTP

revision = "b9c0d1e20016"
down_revision = "a8b9c0d10015"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    PasswordResetOTP.__table__.create(bind, checkfirst=True)


def downgrade():
    bind = op.get_bind()
    PasswordResetOTP.__table__.drop(bind, checkfirst=True)
