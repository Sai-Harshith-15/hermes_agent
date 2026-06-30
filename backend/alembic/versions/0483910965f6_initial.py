"""Initial

Revision ID: 0483910965f6
Revises: 8dabc18c8a5d
Create Date: 2026-06-30 09:56:16.685924

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0483910965f6'
down_revision: Union[str, Sequence[str], None] = '8dabc18c8a5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
