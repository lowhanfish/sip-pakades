from sqlalchemy import JSON, Boolean, Column, Date, DateTime, ForeignKey, Integer, String

from app.db.base import Base
from app.models.master.base_master import MasterBaseMixin


class MasterOfficialPosition(Base, MasterBaseMixin):
    __tablename__ = "master_official_positions"

    level = Column(String(20), default="desa", nullable=False)
    sort_order = Column(Integer, default=1, nullable=False)
    is_leadership = Column(Boolean, default=False, nullable=False)


class MasterPotentialCategory(Base, MasterBaseMixin):
    __tablename__ = "master_potential_categories"

    default_unit = Column(String(50), nullable=True)
    icon = Column(String(50), nullable=True)


class MasterTourismCategory(Base, MasterBaseMixin):
    __tablename__ = "master_tourism_categories"

    icon = Column(String(50), nullable=True)


class MasterReportType(Base, MasterBaseMixin):
    __tablename__ = "master_report_types"

    summary_schema = Column(JSON, nullable=True)
    required_attachments = Column(JSON, nullable=True)


class ReportPeriod(Base, MasterBaseMixin):
    __tablename__ = "report_periods"

    district_id = Column(String(36), ForeignKey("master_districts.id"), nullable=True, index=True)
    period_year = Column(Integer, nullable=False, index=True)
    period_quarter = Column(Integer, nullable=False, index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    deadline_at = Column(DateTime(timezone=True), nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)


class MasterLetterClassification(Base, MasterBaseMixin):
    __tablename__ = "master_letter_classifications"


class MasterServiceType(Base, MasterBaseMixin):
    __tablename__ = "master_service_types"

    sla_days = Column(Integer, default=3, nullable=False)
    requirements = Column(JSON, nullable=True)
    letter_classification_id = Column(
        String(36), ForeignKey("master_letter_classifications.id"), nullable=True
    )
    template_code = Column(String(50), nullable=True)
