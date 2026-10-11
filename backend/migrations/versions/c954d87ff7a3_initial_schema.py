"""initial_schema

Revision ID: c954d87ff7a3
Revises: 
Create Date: 2026-10-11 13:58:51.910968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c954d87ff7a3'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from app.models.base import Base
    import app.models  # noqa: F401
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    from app.models.base import Base
    import app.models  # noqa: F401
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)
