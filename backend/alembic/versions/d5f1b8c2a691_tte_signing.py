"""tte_signing

Revision ID: d5f1b8c2a691
Revises: c3e9a5d17f42
Create Date: 2026-11-26 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5f1b8c2a691'
down_revision: Union[str, None] = 'c3e9a5d17f42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('signer_nik_encrypted', sa.Text(), nullable=True))
    op.add_column('service_requests', sa.Column('verification_code', sa.String(length=32), nullable=True))
    op.create_index(op.f('ix_service_requests_verification_code'), 'service_requests', ['verification_code'], unique=True)
    op.create_table('signing_transactions',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('service_request_id', sa.String(length=36), nullable=False),
    sa.Column('requested_by', sa.String(length=36), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('idempotency_key', sa.String(length=64), nullable=False),
    sa.Column('gateway_request_id', sa.String(length=64), nullable=True),
    sa.Column('error_code', sa.String(length=60), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('unsigned_sha256', sa.String(length=64), nullable=True),
    sa.Column('signed_sha256', sa.String(length=64), nullable=True),
    sa.Column('signed_file_path', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('idempotency_key')
    )
    op.create_index(op.f('ix_signing_transactions_service_request_id'), 'signing_transactions', ['service_request_id'], unique=False)
    op.create_index(op.f('ix_signing_transactions_status'), 'signing_transactions', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_signing_transactions_status'), table_name='signing_transactions')
    op.drop_index(op.f('ix_signing_transactions_service_request_id'), table_name='signing_transactions')
    op.drop_table('signing_transactions')
    op.drop_index(op.f('ix_service_requests_verification_code'), table_name='service_requests')
    op.drop_column('service_requests', 'verification_code')
    op.drop_column('users', 'signer_nik_encrypted')
