"""signing_active_slot

Revision ID: e6a2c9d4b813
Revises: d5f1b8c2a691
Create Date: 2026-11-27 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e6a2c9d4b813'
down_revision: Union[str, None] = 'd5f1b8c2a691'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('signing_transactions', sa.Column('active_slot', sa.String(length=36), nullable=True))
    op.create_unique_constraint('uq_signing_active_slot', 'signing_transactions', ['active_slot'])
    # Transaksi yang masih berjalan/belum pasti mengunci surat terkait.
    op.execute("UPDATE signing_transactions SET active_slot = service_request_id WHERE status IN ('sending', 'unknown')")


def downgrade() -> None:
    op.drop_constraint('uq_signing_active_slot', 'signing_transactions', type_='unique')
    op.drop_column('signing_transactions', 'active_slot')
