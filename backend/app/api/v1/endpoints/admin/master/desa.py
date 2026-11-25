from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_roles,
    resolve_district_scope,
    resolve_village_scope,
)
from app.api.v1.endpoints.admin.master.schema import VillageCreate
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterDistrict, MasterVillage
from app.services.crud_service import CRUDBase

router = APIRouter(prefix="/desa", tags=["Master Desa/Kelurahan"])
crud = CRUDBase(MasterVillage)


def _to_dict(v: MasterVillage, district_name: str = "-") -> dict:
    return {
        "id": v.id,
        "district_id": v.district_id,
        "district_name": district_name,
        "code": v.code,
        "name": v.name,
        "slug": v.slug,
        "type": v.type,
        "description": v.description,
        "history": v.history,
        "boundaries": v.boundaries,
        "area_km2": v.area_km2,
        "dusun_count": v.dusun_count,
        "rw_count": v.rw_count,
        "rt_count": v.rt_count,
        "population_total": v.population_total,
        "household_total": v.household_total,
        "latitude": v.latitude,
        "longitude": v.longitude,
        "is_active": v.is_active,
        "created_at": v.created_at,
        "updated_at": v.updated_at,
    }


@router.get("/read")
async def read_villages(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    district_id: str | None = Query(None),
    type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scoped_district = resolve_district_scope(current_user, district_id)
    scoped_village = resolve_village_scope(current_user, None)

    stmt = select(MasterVillage)
    if scoped_district:
        stmt = stmt.where(MasterVillage.district_id == scoped_district)
    if scoped_village:
        stmt = stmt.where(MasterVillage.id == scoped_village)
    if type:
        stmt = stmt.where(MasterVillage.type == type)
    if search.strip():
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(MasterVillage.name.ilike(like), MasterVillage.code.ilike(like)))

    total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
    rows = (
        await db.execute(stmt.order_by(MasterVillage.code.asc()).offset(skip).limit(limit))
    ).scalars().all()

    districts = {
        d.id: d.name
        for d in (await db.execute(select(MasterDistrict))).scalars().all()
    }
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [_to_dict(v, districts.get(v.district_id, "-")) for v in rows],
    }


@router.get("/option")
async def option_villages(
    district_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scoped_district = resolve_district_scope(current_user, district_id)
    scoped_village = resolve_village_scope(current_user, None)
    stmt = select(MasterVillage).where(MasterVillage.is_active.is_(True))
    if scoped_district:
        stmt = stmt.where(MasterVillage.district_id == scoped_district)
    if scoped_village:
        stmt = stmt.where(MasterVillage.id == scoped_village)
    rows = (await db.execute(stmt.order_by(MasterVillage.name.asc()))).scalars().all()
    return [
        {
            "id": v.id,
            "label": f"{'Kel.' if v.type == 'kelurahan' else 'Desa'} {v.name}",
            "code": v.code,
            "meta": {"district_id": v.district_id, "type": v.type},
        }
        for v in rows
    ]


@router.post("/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_village(
    payload: VillageCreate,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    target_district = resolve_district_scope(current_user, payload.district_id)
    if not target_district:
        raise AppError("Kecamatan induk wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    data = payload.model_dump()
    data["district_id"] = target_district
    data["created_by"] = current_user.id
    data["updated_by"] = current_user.id
    item = await crud.create(db, obj_in=data)
    return {"success": True, "message": "Desa/Kelurahan berhasil ditambahkan", "data": _to_dict(item)}


@router.put("/update/{item_id}", dependencies=[Depends(verify_csrf)])
async def update_village(
    item_id: str,
    payload: VillageCreate,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get(db, item_id)
    if not item:
        raise AppError("Desa/Kelurahan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, item.district_id)
    data = payload.model_dump()
    data["district_id"] = (
        item.district_id if current_user.role_code != "superadmin_kab" else (payload.district_id or item.district_id)
    )
    data["updated_by"] = current_user.id
    updated = await crud.update(db, db_obj=item, obj_in=data)
    return {"success": True, "message": "Desa/Kelurahan berhasil diperbarui", "data": _to_dict(updated)}


@router.delete("/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_village(
    item_id: str,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get(db, item_id)
    if not item:
        raise AppError("Desa/Kelurahan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, item.district_id)
    await crud.delete(db, db_obj=item)
    return {"success": True, "message": "Desa/Kelurahan berhasil dihapus", "data": {"id": item_id}}
