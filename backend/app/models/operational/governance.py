from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from app.db.base import Base
from app.models.operational.base import OperationalBaseMixin


class GovernmentOfficial(Base, OperationalBaseMixin):
    __tablename__ = "government_officials"

    position_id = Column(
        String(36), ForeignKey("master_official_positions.id"), nullable=False, index=True
    )
    full_name = Column(String(150), nullable=False)
    nip = Column(String(32), nullable=True)
    sk_number = Column(String(80), nullable=True)
    term_start = Column(Date, nullable=True)
    term_end = Column(Date, nullable=True)
    phone = Column(String(30), nullable=True)
    photo_url = Column(String(255), nullable=True)
    welcome_message = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class RegionalPotential(Base, OperationalBaseMixin):
    __tablename__ = "regional_potentials"

    category_id = Column(
        String(36), ForeignKey("master_potential_categories.id"), nullable=False, index=True
    )
    title = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    metric_value = Column(Float, default=0.0, nullable=False)
    metric_unit = Column(String(50), nullable=False)
    period_year = Column(Integer, default=2026, nullable=False)
    image_url = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)


class TouristDestination(Base, OperationalBaseMixin):
    __tablename__ = "tourist_destinations"

    category_id = Column(
        String(36), ForeignKey("master_tourism_categories.id"), nullable=False, index=True
    )
    name = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    facilities = Column(JSON, nullable=True)
    opening_hours = Column(String(120), nullable=True)
    ticket_info = Column(String(120), nullable=True)
    cover_image_url = Column(String(255), nullable=True)
    gallery_urls = Column(JSON, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)


class GovernmentAnnouncement(Base, OperationalBaseMixin):
    __tablename__ = "government_announcements"

    title = Column(String(220), nullable=False)
    slug = Column(String(240), unique=True, nullable=False, index=True)
    category = Column(String(30), default="berita", nullable=False, index=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    thumbnail_url = Column(String(255), nullable=True)
    status = Column(String(20), default="terbit", nullable=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)


class GovernmentRegulation(Base, OperationalBaseMixin):
    __tablename__ = "government_regulations"

    title = Column(String(220), nullable=False)
    regulation_number = Column(String(120), nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String(255), nullable=True)
    file_size = Column(Integer, default=0, nullable=False)
    sha256_hash = Column(String(64), nullable=True)
    status = Column(String(20), default="terbit", nullable=False, index=True)
