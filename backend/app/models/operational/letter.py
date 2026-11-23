import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.sql import func

from app.db.base import Base
from app.models.operational.base import OperationalBaseMixin


class IncomingLetter(Base, OperationalBaseMixin):
    __tablename__ = "incoming_letters"

    classification_id = Column(
        String(36), ForeignKey("master_letter_classifications.id"), nullable=False, index=True
    )
    agenda_number = Column(String(60), unique=True, nullable=False, index=True)
    origin_letter_number = Column(String(120), nullable=False)
    origin_sender = Column(String(180), nullable=False)
    letter_date = Column(Date, nullable=False)
    received_date = Column(Date, nullable=False)
    subject = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    urgency = Column(String(20), default="biasa", nullable=False)
    disposition_status = Column(String(30), default="baru", nullable=False, index=True)
    scan_file_path = Column(String(500), nullable=True)


class LetterDisposition(Base):
    __tablename__ = "letter_dispositions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incoming_letter_id = Column(
        String(36), ForeignKey("incoming_letters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    target_user_name = Column(String(150), nullable=False)
    instruction = Column(Text, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(30), default="didisposisikan", nullable=False)
    action_note = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class OutgoingLetter(Base, OperationalBaseMixin):
    __tablename__ = "outgoing_letters"

    classification_id = Column(
        String(36), ForeignKey("master_letter_classifications.id"), nullable=False, index=True
    )
    service_request_id = Column(String(36), nullable=True, index=True)
    letter_number = Column(String(120), unique=True, nullable=False, index=True)
    letter_type = Column(String(30), default="rekomendasi", nullable=False)
    recipient = Column(String(180), nullable=False)
    letter_date = Column(Date, nullable=False)
    subject = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    auto_number = Column(Boolean, default=True, nullable=False)
    scan_file_path = Column(String(500), nullable=True)
