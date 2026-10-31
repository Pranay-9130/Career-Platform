"""add job eligibility fields (eligible_batches, candidate_type, eligible_qualifications)

Revision ID: c3d4e5f60011
Revises: b2c3d4e50010
"""

from alembic import op
import sqlalchemy as sa


revision = "c3d4e5f60011"
down_revision = "b2c3d4e50010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"]: column for column in inspector.get_columns("jobs")}

    with op.batch_alter_table("jobs") as batch_op:
        if "eligible_batches" not in columns:
            batch_op.add_column(
                sa.Column(
                    "eligible_batches",
                    sa.JSON(),
                    nullable=False,
                    server_default="[]",
                )
            )
        if "candidate_type" not in columns:
            batch_op.add_column(
                sa.Column(
                    "candidate_type",
                    sa.String(length=50),
                    nullable=True,
                )
            )
        if "eligible_qualifications" not in columns:
            batch_op.add_column(
                sa.Column(
                    "eligible_qualifications",
                    sa.JSON(),
                    nullable=False,
                    server_default="[]",
                )
            )


def downgrade() -> None:
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_column("eligible_qualifications")
        batch_op.drop_column("candidate_type")
        batch_op.drop_column("eligible_batches")
