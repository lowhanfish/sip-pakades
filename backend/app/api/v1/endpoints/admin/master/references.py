from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.api.v1.endpoints.admin.master.schema import SimpleMasterPayload
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import (
    MasterLetterClassification,
    MasterOfficialPosition,
    MasterPotentialCategory,
    MasterReportType,
    MasterServiceType,
    MasterTourismCategory,
    ReportPeriod,
)
from app.services.crud_service import CRUDBase


def build_simple_master_router(
    prefix: str,
    tag: str,
    model: type,
    *,
    write_roles: tuple[str, ...] = ("superadmin_kab", "admin_kecamatan"),
) -> APIRouter:
    r = APIRouter(prefix=prefix, tags=[tag])
    crud = CRUDBase(model)

    def serialize(obj: object) -> dict:
        data = {
            "id": obj.id,
            "code": obj.code,
            "name": obj.name,
            "description": getattr(obj, "description", None),
            "is_active": getattr(obj, "is_active", True),
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
        }
        for extra in (
            "level",
            "sort_order",
            "is_leadership",
            "default_unit",
            "sla_days",
            "period_year",
            "period_quarter",
            "deadline_at",
            "is_open",
        ):
            if hasattr(obj, extra):
                data[extra] = getattr(obj, extra)
        return data

    @r.get("/read")
    async def read_items(
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        search: str = Query(""),
        _: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        stmt = select(model)
        if search.strip():
            like = f"%{search.strip()}%"
            stmt = stmt.where(or_(model.name.ilike(like), model.code.ilike(like)))
        total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
        rows = (await db.execute(stmt.order_by(model.code.asc()).offset(skip).limit(limit))).scalars().all()
        return {"total": total, "skip": skip, "limit": limit, "data": [serialize(x) for x in rows]}

    @r.get("/option")
    async def option_items(
        _: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        rows = (
            await db.execute(
                select(model).where(model.is_active.is_(True)).order_by(model.code.asc())
            )
        ).scalars().all()
        return [{"id": x.id, "label": x.name, "code": x.code, "meta": {}} for x in rows]

    @r.post("/create", status_code=201, dependencies=[Depends(verify_csrf)])
    async def create_item(
        payload: SimpleMasterPayload,
        current_user: User = Depends(require_roles(*write_roles)),
        db: AsyncSession = Depends(get_db),
    ):
        data = payload.model_dump(exclude_none=True)
        data["created_by"] = current_user.id
        data["updated_by"] = current_user.id
        if model is ReportPeriod and "deadline_at" not in data:
            year = data.get("period_year") or 2026
            data["deadline_at"] = datetime(year, 12, 31, 16, 0, tzinfo=UTC)
        created = await crud.create(db, obj_in=data)
        return {"success": True, "message": "Data master ditambahkan", "data": serialize(created)}

    @r.put("/update/{item_id}", dependencies=[Depends(verify_csrf)])
    async def update_item(
        item_id: str,
        payload: SimpleMasterPayload,
        current_user: User = Depends(require_roles(*write_roles)),
        db: AsyncSession = Depends(get_db),
    ):
        obj = await crud.get(db, item_id)
        if not obj:
            raise AppError("Data tidak ditemukan.", code="NOT_FOUND", status_code=404)
        data = payload.model_dump(exclude_none=True)
        data["updated_by"] = current_user.id
        updated = await crud.update(db, db_obj=obj, obj_in=data)
        return {"success": True, "message": "Data master diperbarui", "data": serialize(updated)}

    @r.delete("/delete/{item_id}", dependencies=[Depends(verify_csrf)])
    async def delete_item(
        item_id: str,
        _: User = Depends(require_roles(*write_roles)),
        db: AsyncSession = Depends(get_db),
    ):
        obj = await crud.get(db, item_id)
        if not obj:
            raise AppError("Data tidak ditemukan.", code="NOT_FOUND", status_code=404)
        await crud.delete(db, db_obj=obj)
        return {"success": True, "message": "Data master dihapus", "data": {"id": item_id}}

    return r


jabatan_router = build_simple_master_router(
    "/jabatan", "Master Jabatan", MasterOfficialPosition, write_roles=("superadmin_kab",)
)
kategori_potensi_router = build_simple_master_router(
    "/kategori-potensi", "Master Kategori Potensi", MasterPotentialCategory, write_roles=("superadmin_kab",)
)
kategori_wisata_router = build_simple_master_router(
    "/kategori-wisata", "Master Kategori Wisata", MasterTourismCategory, write_roles=("superadmin_kab",)
)
jenis_laporan_router = build_simple_master_router(
    "/jenis-laporan", "Master Jenis Laporan", MasterReportType
)
periode_laporan_router = build_simple_master_router(
    "/periode-laporan", "Master Periode Laporan", ReportPeriod
)
jenis_layanan_router = build_simple_master_router(
    "/jenis-layanan", "Master Jenis Layanan", MasterServiceType
)
klasifikasi_surat_router = build_simple_master_router(
    "/klasifikasi-surat", "Master Klasifikasi Surat", MasterLetterClassification
)
