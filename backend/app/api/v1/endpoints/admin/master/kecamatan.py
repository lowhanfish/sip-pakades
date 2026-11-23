from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.api.v1.endpoints.admin.master.schema import DistrictCreate
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterDistrict, MasterVillage
from app.services.crud_service import CRUDBase

router = APIRouter(prefix="/kecamatan", tags=["Master Kecamatan"])
crud = CRUDBase(MasterDistrict)


def _to_dict(d: MasterDistrict, village_count: int = 0) -> dict:
    return {
        "id": d.id,
        "code": d.code,
        "name": d.name,
        "slug": d.slug,
        "office_address": d.office_address,
        "phone": d.phone,
        "email": d.email,
        "service_hours": d.service_hours,
        "vision": d.vision,
        "mission": d.mission,
        "latitude": d.latitude,
        "longitude": d.longitude,
        "is_active": d.is_active,
        "is_default": d.is_default,
        "village_count": village_count,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
    }


@router.get("/read")
async def read_districts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MasterDistrict)
    if current_user.role_code != "superadmin_kab" and current_user.district_id:
        stmt = stmt.where(MasterDistrict.id == current_user.district_id)
    if search.strip():
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                MasterDistrict.name.ilike(like),
                MasterDistrict.code.ilike(like),
                MasterDistrict.slug.ilike(like),
            )
        )
    total_res = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = int(total_res.scalar_one())

    rows = (
        await db.execute(stmt.order_by(MasterDistrict.code.asc()).offset(skip).limit(limit))
    ).scalars().all()

    counts_res = await db.execute(
        select(MasterVillage.district_id, func.count(MasterVillage.id)).group_by(
            MasterVillage.district_id
        )
    )
    counts_map = {row[0]: int(row[1]) for row in counts_res.all()}

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [_to_dict(d, counts_map.get(d.id, 0)) for d in rows],
    }


@router.get("/option")
async def option_districts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MasterDistrict).where(MasterDistrict.is_active.is_(True))
    if current_user.role_code != "superadmin_kab" and current_user.district_id:
        stmt = stmt.where(MasterDistrict.id == current_user.district_id)
    rows = (await db.execute(stmt.order_by(MasterDistrict.name.asc()))).scalars().all()
    return [
        {
            "id": d.id,
            "label": d.name,
            "code": d.code,
            "meta": {"slug": d.slug, "is_default": d.is_default},
        }
        for d in rows
    ]


@router.get("/detail/{item_id}")
async def detail_district(
    item_id: str,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get(db, item_id)
    if not item:
        raise AppError("Kecamatan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return {"success": True, "message": "OK", "data": _to_dict(item)}


@router.post("/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_district(
    payload: DistrictCreate,
    current_user: User = Depends(require_roles("superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump()
    if data.get("is_default"):
        await db.execute(update(MasterDistrict).values(is_default=False))
    data["created_by"] = current_user.id
    data["updated_by"] = current_user.id
    item = await crud.create(db, obj_in=data)
    return {"success": True, "message": "Kecamatan berhasil ditambahkan", "data": _to_dict(item)}


@router.put("/update/{item_id}", dependencies=[Depends(verify_csrf)])
async def update_district(
    item_id: str,
    payload: DistrictCreate,
    current_user: User = Depends(require_roles("superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get(db, item_id)
    if not item:
        raise AppError("Kecamatan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    data = payload.model_dump()
    if data.get("is_default"):
        await db.execute(update(MasterDistrict).values(is_default=False))
    data["updated_by"] = current_user.id
    updated = await crud.update(db, db_obj=item, obj_in=data)
    return {"success": True, "message": "Kecamatan berhasil diperbarui", "data": _to_dict(updated)}


@router.delete("/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_district(
    item_id: str,
    _: User = Depends(require_roles("superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get(db, item_id)
    if not item:
        raise AppError("Kecamatan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    await crud.delete(db, db_obj=item)
    return {"success": True, "message": "Kecamatan berhasil dihapus", "data": {"id": item_id}}
