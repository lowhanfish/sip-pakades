import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.operational.base import OperationalBaseMixin


class QuarterlyReport(Base, OperationalBaseMixin):
    __tablename__ = "quarterly_reports"
    __table_args__ = (
        UniqueConstraint("village_id", "report_type_id", "period_id", name="uq_report_village_type_period"),
    )

    report_type_id = Column(
        String(36), ForeignKey("master_report_types.id"), nullable=False, index=True
    )
    period_id = Column(
        String(36), ForeignKey("report_periods.id"), nullable=False, index=True
    )
    title = Column(String(220), nullable=False)
    status = Column(String(30), default="draf", nullable=False, index=True)
    submission_version = Column(Integer, default=1, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    revision_note = Column(Text, nullable=True)
    summary_payload = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)


class ReportAttachment(Base):
    __tablename__ = "report_attachments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(
        String(36), ForeignKey("quarterly_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_label = Column(String(150), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    mime_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    uploaded_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ReportStatusHistory(Base):
    __tablename__ = "report_status_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(
        String(36), ForeignKey("quarterly_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    submission_version = Column(Integer, default=1, nullable=False)
    changed_by = Column(String(36), nullable=True)
    changed_by_name = Column(String(150), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
