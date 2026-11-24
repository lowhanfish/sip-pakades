import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.operational.base import OperationalBaseMixin


class ServiceRequest(Base, OperationalBaseMixin):
    __tablename__ = "service_requests"

    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    service_type_id = Column(
        String(36), ForeignKey("master_service_types.id"), nullable=False, index=True
    )
    citizen_id = Column(
        String(36), ForeignKey("citizens.id", ondelete="SET NULL"), nullable=True, index=True
    )
    applicant_name = Column(String(150), nullable=False)
    # Pengajuan warga menyimpan NIK terenkripsi berawalan "enc:"; data lama berupa teks biasa.
    applicant_nik = Column(String(255), nullable=False)
    applicant_phone = Column(String(30), nullable=True)
    applicant_address = Column(String(255), nullable=True)
    village_cover_letter_no = Column(String(100), nullable=True)
    status = Column(String(30), default="diterima", nullable=False, index=True)
    sla_days = Column(Integer, default=3, nullable=False)
    sla_due_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Kode pada QR surat untuk pemeriksaan keaslian oleh publik.
    verification_code = Column(String(32), unique=True, nullable=True, index=True)
    verified_by = Column(String(36), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    outgoing_letter_id = Column(String(36), nullable=True)
    request_payload = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)


class ServiceDocument(Base):
    __tablename__ = "service_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_request_id = Column(
        String(36), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_code = Column(String(50), nullable=False)
    doc_label = Column(String(150), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    is_private = Column(Boolean, default=True, nullable=False)
    uploaded_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ServiceStatusHistory(Base):
    __tablename__ = "service_status_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_request_id = Column(
        String(36), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    public_note = Column(Text, nullable=True)
    changed_by = Column(String(36), nullable=True)
    changed_by_name = Column(String(150), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ServiceOffering(Base):
    """Layanan yang dibuka sebuah kecamatan. Baru tayang ke warga setelah diaktifkan Camat."""

    __tablename__ = "district_service_offerings"
    __table_args__ = (UniqueConstraint("district_id", "service_type_id", name="uq_offering"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    district_id = Column(
        String(36), ForeignKey("master_districts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_type_id = Column(
        String(36), ForeignKey("master_service_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    is_active = Column(Boolean, default=False, nullable=False)
    legal_basis = Column(Text, nullable=True)
    legal_basis_reviewed_at = Column(Date, nullable=True)
    criteria_checks = Column(JSON, nullable=True)
    not_village_function = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    activated_by = Column(String(36), nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    updated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SigningTransaction(Base):
    """Jejak satu upaya tanda tangan elektronik. Passphrase tidak pernah disimpan."""

    __tablename__ = "signing_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_request_id = Column(
        String(36), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requested_by = Column(String(36), nullable=False)
    # sending | succeeded | failed | unknown
    status = Column(String(20), default="sending", nullable=False, index=True)
    # Terisi (= id permohonan) selama transaksi masih berjalan/belum pasti, dikosongkan saat final.
    # Kolom unik ini membuat database menolak dua penandatanganan serentak untuk surat yang sama.
    active_slot = Column(String(36), unique=True, nullable=True)
    idempotency_key = Column(String(64), unique=True, nullable=False)
    gateway_request_id = Column(String(64), nullable=True)
    error_code = Column(String(60), nullable=True)
    error_message = Column(Text, nullable=True)
    unsigned_sha256 = Column(String(64), nullable=True)
    signed_sha256 = Column(String(64), nullable=True)
    signed_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
