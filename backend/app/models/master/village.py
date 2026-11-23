from sqlalchemy import JSON, Column, Float, ForeignKey, Integer, String, Text

from app.db.base import Base
from app.models.master.base_master import MasterBaseMixin


class MasterVillage(Base, MasterBaseMixin):
    __tablename__ = "master_villages"

    district_id = Column(
        String(36),
        ForeignKey("master_districts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    slug = Column(String(120), nullable=False, index=True)
    type = Column(String(20), default="desa", nullable=False, index=True)
    history = Column(Text, nullable=True)
    boundaries = Column(JSON, nullable=True)
    area_km2 = Column(Float, nullable=True)
    dusun_count = Column(Integer, default=0, nullable=False)
    rw_count = Column(Integer, default=0, nullable=False)
    rt_count = Column(Integer, default=0, nullable=False)
    population_total = Column(Integer, default=0, nullable=False)
    household_total = Column(Integer, default=0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
