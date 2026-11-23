import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.sql import func


class OperationalBaseMixin:
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    district_id = Column(
        String(36),
        ForeignKey("master_districts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    village_id = Column(
        String(36),
        ForeignKey("master_villages.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    created_by = Column(String(36), nullable=True)
    updated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
