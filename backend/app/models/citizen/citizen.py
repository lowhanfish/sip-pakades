import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class Citizen(Base):
    """Akun masyarakat (warga). Sengaja terpisah dari `users` milik petugas."""

    __tablename__ = "citizens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    # NIK disimpan terenkripsi; `nik_hash` untuk keunikan tanpa membuka nilai asli.
    nik_encrypted = Column(Text, nullable=True)
    nik_hash = Column(String(64), unique=True, nullable=True, index=True)
    district_id = Column(
        String(36), ForeignKey("master_districts.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    village_id = Column(
        String(36), ForeignKey("master_villages.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CitizenSession(Base):
    __tablename__ = "citizen_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    citizen_id = Column(
        String(36), ForeignKey("citizens.id", ondelete="CASCADE"), nullable=False, index=True
    )
    jti = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
