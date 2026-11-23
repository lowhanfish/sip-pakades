from pydantic import BaseModel


class DistrictCreate(BaseModel):
    code: str
    name: str
    slug: str
    office_address: str | None = None
    phone: str | None = None
    email: str | None = None
    service_hours: str | None = None
    vision: str | None = None
    mission: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True
    is_default: bool = False


class VillageCreate(BaseModel):
    district_id: str | None = None
    code: str
    name: str
    slug: str
    type: str = "desa"
    description: str | None = None
    history: str | None = None
    boundaries: dict[str, str | None] | None = None
    area_km2: float | None = None
    dusun_count: int = 0
    rw_count: int = 0
    rt_count: int = 0
    population_total: int = 0
    household_total: int = 0
    latitude: float | None = None
    longitude: float | None = None
    is_active: bool = True


class SimpleMasterPayload(BaseModel):
    code: str
    name: str
    description: str | None = None
    is_active: bool = True
    level: str | None = None
    sort_order: int | None = None
    default_unit: str | None = None
    sla_days: int | None = None
    period_year: int | None = None
    period_quarter: int | None = None
    is_open: bool | None = None
