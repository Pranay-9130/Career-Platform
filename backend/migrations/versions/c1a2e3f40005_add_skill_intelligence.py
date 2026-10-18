"""Add student target roles and student skills tables.

Revision ID: c1a2e3f40005
Revises: b84d2ea40004
"""
from alembic import op
from app.models.skill_intelligence import StudentTargetRole, StudentSkill

revision = "c1a2e3f40005"
down_revision = "b84d2ea40004"
branch_labels = None
depends_on = None


def upgrade():
    StudentTargetRole.__table__.create(op.get_bind(), checkfirst=True)
    StudentSkill.__table__.create(op.get_bind(), checkfirst=True)


def downgrade():
    StudentSkill.__table__.drop(op.get_bind(), checkfirst=True)
    StudentTargetRole.__table__.drop(op.get_bind(), checkfirst=True)
