"""service_request_verification

Revision ID: c3e9a5d17f42
Revises: b7d2e41c8a05
Create Date: 2026-11-25 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3e9a5d17f42'
down_revision: Union[str, None] = 'b7d2e41c8a05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('service_requests', sa.Column('verified_by', sa.String(length=36), nullable=True))
    op.add_column('service_requests', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('service_requests', 'verified_at')
    op.drop_column('service_requests', 'verified_by')
