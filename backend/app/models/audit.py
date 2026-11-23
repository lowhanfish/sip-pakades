import uuid

from sqlalchemy import JSON, BigInteger, Column, DateTime, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    district_id = Column(String(36), nullable=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(80), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False)
    summary = Column(Text, nullable=True)
    before_data = Column(JSON, nullable=True)
    after_data = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BackupLog(Base):
    __tablename__ = "backup_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    status = Column(String(20), nullable=False)
    triggered_by_name = Column(String(150), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
