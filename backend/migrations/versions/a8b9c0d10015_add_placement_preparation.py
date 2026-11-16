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
    bind = op.get_bind()
    PreparationRole.__table__.create(bind, checkfirst=True)
    PreparationTopic.__table__.create(bind, checkfirst=True)
    PreparationMaterial.__table__.create(bind, checkfirst=True)

    # Ensure file_content column exists if table was previously created
    inspector = sa.inspect(bind)
    if "preparation_materials" in inspector.get_table_names():
        cols = {col["name"] for col in inspector.get_columns("preparation_materials")}
        if "file_content" not in cols:
            op.add_column("preparation_materials", sa.Column("file_content", sa.LargeBinary(), nullable=True))


def downgrade():
    PreparationMaterial.__table__.drop(op.get_bind(), checkfirst=True)
    PreparationTopic.__table__.drop(op.get_bind(), checkfirst=True)
    PreparationRole.__table__.drop(op.get_bind(), checkfirst=True)
