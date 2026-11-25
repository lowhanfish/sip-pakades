"""service_catalog_and_citizen_requests

Revision ID: b7d2e41c8a05
Revises: a1c3f0b7d9e2
Create Date: 2026-11-24 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7d2e41c8a05'
down_revision: Union[str, None] = 'a1c3f0b7d9e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('master_service_types', sa.Column('category', sa.String(length=20), nullable=False, server_default='rekomendasi'))
    op.add_column('master_service_types', sa.Column('requires_village_letter', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('master_service_types', sa.Column('form_fields', sa.JSON(), nullable=True))
    # Data lama: IUMK adalah perizinan, sehingga wajib memenuhi kriteria PP 17/2018 Pasal 11 ayat (3).
    # Dicocokkan lewat id karena kodenya berbeda antar-database (SIP-IUMK / PATEN-IUMK).
    op.execute("UPDATE master_service_types SET category = 'perizinan' WHERE id = 'srv-iumk'")

    op.add_column('service_requests', sa.Column('citizen_id', sa.String(length=36), nullable=True))
    op.create_index(op.f('ix_service_requests_citizen_id'), 'service_requests', ['citizen_id'], unique=False)
    op.create_foreign_key('fk_service_requests_citizen', 'service_requests', 'citizens', ['citizen_id'], ['id'], ondelete='SET NULL')
    # NIK pengajuan warga disimpan terenkripsi sehingga lebih panjang dari 32 karakter.
    op.alter_column('service_requests', 'applicant_nik', existing_type=sa.String(length=32), type_=sa.String(length=255), existing_nullable=False)

    op.create_table('district_service_offerings',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('district_id', sa.String(length=36), nullable=False),
    sa.Column('service_type_id', sa.String(length=36), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('legal_basis', sa.Text(), nullable=True),
    sa.Column('legal_basis_reviewed_at', sa.Date(), nullable=True),
    sa.Column('criteria_checks', sa.JSON(), nullable=True),
    sa.Column('not_village_function', sa.Boolean(), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('activated_by', sa.String(length=36), nullable=True),
    sa.Column('activated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('updated_by', sa.String(length=36), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['district_id'], ['master_districts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['service_type_id'], ['master_service_types.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('district_id', 'service_type_id', name='uq_offering')
    )
    op.create_index(op.f('ix_district_service_offerings_district_id'), 'district_service_offerings', ['district_id'], unique=False)
    op.create_index(op.f('ix_district_service_offerings_service_type_id'), 'district_service_offerings', ['service_type_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_district_service_offerings_service_type_id'), table_name='district_service_offerings')
    op.drop_index(op.f('ix_district_service_offerings_district_id'), table_name='district_service_offerings')
    op.drop_table('district_service_offerings')
    op.alter_column('service_requests', 'applicant_nik', existing_type=sa.String(length=255), type_=sa.String(length=32), existing_nullable=False)
    op.drop_constraint('fk_service_requests_citizen', 'service_requests', type_='foreignkey')
    op.drop_index(op.f('ix_service_requests_citizen_id'), table_name='service_requests')
    op.drop_column('service_requests', 'citizen_id')
    op.drop_column('master_service_types', 'form_fields')
    op.drop_column('master_service_types', 'requires_village_letter')
    op.drop_column('master_service_types', 'category')
