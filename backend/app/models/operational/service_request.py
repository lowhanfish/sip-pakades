import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.operational.base import OperationalBaseMixin


class ServiceRequest(Base, OperationalBaseMixin):
    __tablename__ = "service_requests"

    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    service_type_id = Column(
        String(36), ForeignKey("master_service_types.id"), nullable=False, index=True
    )
    applicant_name = Column(String(150), nullable=False)
    applicant_nik = Column(String(32), nullable=False)
    applicant_phone = Column(String(30), nullable=True)
    applicant_address = Column(String(255), nullable=True)
    village_cover_letter_no = Column(String(100), nullable=True)
    status = Column(String(30), default="diterima", nullable=False, index=True)
    sla_days = Column(Integer, default=3, nullable=False)
    sla_due_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
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
