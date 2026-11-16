"""add placement preparation tables

Revision ID: a8b9c0d10015
Revises: f6a7b8c90014
"""
from alembic import op
import sqlalchemy as sa
from app.models.placement_preparation import PreparationRole, PreparationTopic, PreparationMaterial

revision = "a8b9c0d10015"
down_revision = "f6a7b8c90014"
branch_labels = None
depends_on = None


def upgrade():
    PreparationRole.__table__.create(op.get_bind(), checkfirst=True)
    PreparationTopic.__table__.create(op.get_bind(), checkfirst=True)
    PreparationMaterial.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    PreparationMaterial.__table__.drop(op.get_bind(), checkfirst=True)
    PreparationTopic.__table__.drop(op.get_bind(), checkfirst=True)
    PreparationRole.__table__.drop(op.get_bind(), checkfirst=True)
