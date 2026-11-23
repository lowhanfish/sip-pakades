from sqlalchemy import Boolean, Column, Float, String, Text

from app.db.base import Base
from app.models.master.base_master import MasterBaseMixin


class MasterDistrict(Base, MasterBaseMixin):
    __tablename__ = "master_districts"

    slug = Column(String(120), unique=True, nullable=False, index=True)
    office_address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    service_hours = Column(String(150), nullable=True)
    vision = Column(Text, nullable=True)
    mission = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
