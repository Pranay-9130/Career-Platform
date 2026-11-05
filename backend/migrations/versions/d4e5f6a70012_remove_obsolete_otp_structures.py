"""remove obsolete otp and unreferenced auth structures

Revision ID: d4e5f6a70012
Revises: c3d4e5f60011
"""

from alembic import op
import sqlalchemy as sa


revision = "d4e5f6a70012"
down_revision = "c3d4e5f60011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    # 1. Clean up obsolete OTP verification table, foreign keys, and indexes
    if "otp_verifications" in tables:
        indexes = {idx["name"] for idx in inspector.get_indexes("otp_verifications")}
        for idx_name in [
            "ix_otp_verifications_user_id",
            "ix_otp_verifications_email",
            "ix_otp_verifications_purpose",
        ]:
            if idx_name in indexes:
                op.drop_index(idx_name, table_name="otp_verifications")
        op.drop_table("otp_verifications")

    # 2. Safely drop any legacy/deprecated phone columns in users if present
    if "users" in tables:
        user_columns = {col["name"] for col in inspector.get_columns("users")}
        with op.batch_alter_table("users") as batch_op:
            for legacy_col in ["phone_number", "phone", "is_phone_verified"]:
                if legacy_col in user_columns:
                    batch_op.drop_column(legacy_col)

    # 3. Safely drop any legacy/deprecated phone columns in profiles if present
    if "profiles" in tables:
        profile_columns = {col["name"] for col in inspector.get_columns("profiles")}
        with op.batch_alter_table("profiles") as batch_op:
            for legacy_col in ["phone_number", "phone"]:
                if legacy_col in profile_columns:
                    batch_op.drop_column(legacy_col)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "otp_verifications" not in tables:
        op.create_table(
            "otp_verifications",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column(
                "user_id",
                sa.Uuid(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=True,
            ),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("otp_hash", sa.String(length=255), nullable=False),
            sa.Column(
                "purpose",
                sa.String(length=50),
                nullable=False,
                server_default="registration",
            ),
            sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="5"),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_otp_verifications_user_id",
            "otp_verifications",
            ["user_id"],
            unique=False,
        )
        op.create_index(
            "ix_otp_verifications_email",
            "otp_verifications",
            ["email"],
            unique=False,
        )
        op.create_index(
            "ix_otp_verifications_purpose",
            "otp_verifications",
            ["purpose"],
            unique=False,
        )

