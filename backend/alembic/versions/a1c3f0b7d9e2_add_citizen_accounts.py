"""add_citizen_accounts

Revision ID: a1c3f0b7d9e2
Revises: 2dcaaaa51103
Create Date: 2026-11-24 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1c3f0b7d9e2'
down_revision: Union[str, None] = '2dcaaaa51103'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('citizens',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('phone', sa.String(length=30), nullable=True),
    sa.Column('nik_encrypted', sa.Text(), nullable=True),
    sa.Column('nik_hash', sa.String(length=64), nullable=True),
    sa.Column('district_id', sa.String(length=36), nullable=False),
    sa.Column('village_id', sa.String(length=36), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['district_id'], ['master_districts.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['village_id'], ['master_villages.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_citizens_email'), 'citizens', ['email'], unique=True)
    op.create_index(op.f('ix_citizens_nik_hash'), 'citizens', ['nik_hash'], unique=True)
    op.create_index(op.f('ix_citizens_district_id'), 'citizens', ['district_id'], unique=False)
    op.create_index(op.f('ix_citizens_village_id'), 'citizens', ['village_id'], unique=False)

    op.create_table('citizen_sessions',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('citizen_id', sa.String(length=36), nullable=False),
    sa.Column('jti', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['citizen_id'], ['citizens.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_citizen_sessions_citizen_id'), 'citizen_sessions', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_citizen_sessions_jti'), 'citizen_sessions', ['jti'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_citizen_sessions_jti'), table_name='citizen_sessions')
    op.drop_index(op.f('ix_citizen_sessions_citizen_id'), table_name='citizen_sessions')
    op.drop_table('citizen_sessions')
    op.drop_index(op.f('ix_citizens_village_id'), table_name='citizens')
    op.drop_index(op.f('ix_citizens_district_id'), table_name='citizens')
    op.drop_index(op.f('ix_citizens_nik_hash'), table_name='citizens')
    op.drop_index(op.f('ix_citizens_email'), table_name='citizens')
    op.drop_table('citizens')
