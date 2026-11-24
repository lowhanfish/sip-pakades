from fastapi import APIRouter, Depends, File, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, resolve_district_scope, resolve_village_scope
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import (
    MasterDistrict,
    MasterOfficialPosition,
    MasterPotentialCategory,
    MasterTourismCategory,
    MasterVillage,
)
from app.models.operational import GovernmentOfficial, RegionalPotential, TouristDestination
from app.services.crud_service import CRUDBase
from app.services.upload_service import save_public_webp_image

router = APIRouter(prefix="/pemerintahan", tags=["Admin Pemerintahan"])


class OfficialCreate(BaseModel):
    district_id: str | None = None
    village_id: str | None = None
    position_id: str
    full_name: str
    nip: str | None = None
    sk_number: str | None = None
    phone: str | None = None
    is_active: bool = True


class PotentialCreate(BaseModel):
    district_id: str | None = None
    village_id: str | None = None
    category_id: str | None = None
    category_name: str | None = None
    village_name: str | None = None
    title: str
    description: str | None = None
    metric_value: float = 0.0
    metric_unit: str = "Unit"
    period_year: int = 2026


class TourismCreate(BaseModel):
    district_id: str | None = None
    village_id: str | None = None
    category_id: str | None = None
    category_name: str | None = None
    village_name: str | None = None
    name: str
    description: str | None = None
    opening_hours: str | None = "08:00 - 17:00 WITA"
    ticket_info: str | None = "Gratis / Retribusi Desa"


@router.get("/perangkat/read")
async def read_officials(
    search: str = Query(""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(GovernmentOfficial, MasterOfficialPosition, MasterVillage, MasterDistrict)
        .join(MasterOfficialPosition, GovernmentOfficial.position_id == MasterOfficialPosition.id)
        .outerjoin(MasterVillage, GovernmentOfficial.village_id == MasterVillage.id)
        .join(MasterDistrict, GovernmentOfficial.district_id == MasterDistrict.id)
    )
    scoped_dist = resolve_district_scope(current_user, None)
    scoped_vill = resolve_village_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(GovernmentOfficial.district_id == scoped_dist)
    if scoped_vill:
        stmt = stmt.where(GovernmentOfficial.village_id == scoped_vill)
    if search.strip():
        stmt = stmt.where(GovernmentOfficial.full_name.ilike(f"%{search.strip()}%"))

    rows = (await db.execute(stmt)).all()
    data = [
        {
            "id": o.id,
            "district_id": o.district_id,
            "district_name": d.name,
            "village_id": o.village_id,
            "village_name": v.name if v else f"Kantor Kecamatan {d.name}",
            "position_id": o.position_id,
            "position_name": p.name,
            "full_name": o.full_name,
            "nip": o.nip,
            "sk_number": o.sk_number,
            "phone": o.phone,
            "photo_url": o.photo_url,
            "is_active": o.is_active,
            "updated_at": o.updated_at,
        }
        for o, p, v, d in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/perangkat/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_official(
    payload: OfficialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    if not dist_id:
        raise AppError("Kecamatan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    vill_id = resolve_village_scope(current_user, payload.village_id)
    crud = CRUDBase(GovernmentOfficial)
    data = payload.model_dump()
    data["district_id"] = dist_id
    data["village_id"] = vill_id or None
    data["created_by"] = current_user.id
    data["updated_by"] = current_user.id
    obj = await crud.create(db, obj_in=data)
    return {"success": True, "message": "Perangkat ditambahkan", "data": {"id": obj.id, "full_name": obj.full_name}}


@router.post("/perangkat/{item_id}/photo", dependencies=[Depends(verify_csrf)])
async def upload_official_photo(
    item_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    crud = CRUDBase(GovernmentOfficial)
    obj = await crud.get(db, item_id)
    if not obj:
        raise AppError("Perangkat tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, obj.district_id)
    if current_user.role_code == "operator_desa" and obj.village_id != current_user.village_id:
        raise AppError("Akses ditolak.", code="FORBIDDEN", status_code=403)
    photo_url = await save_public_webp_image(file, "officials")
    await crud.update(db, db_obj=obj, obj_in={"photo_url": photo_url, "updated_by": current_user.id})
    return {"success": True, "message": "Foto berhasil dikonversi ke WebP", "data": {"photo_url": photo_url}}


@router.delete("/perangkat/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_official(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    crud = CRUDBase(GovernmentOfficial)
    obj = await crud.get(db, item_id)
    if not obj:
        raise AppError("Perangkat tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, obj.district_id)
    await crud.delete(db, db_obj=obj)
    return {"success": True, "message": "Perangkat dihapus", "data": {"id": item_id}}


@router.get("/potensi/read")
async def read_potentials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(RegionalPotential, MasterPotentialCategory, MasterVillage)
        .join(MasterPotentialCategory, RegionalPotential.category_id == MasterPotentialCategory.id)
        .outerjoin(MasterVillage, RegionalPotential.village_id == MasterVillage.id)
    )
    scoped_dist = resolve_district_scope(current_user, None)
    scoped_vill = resolve_village_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(RegionalPotential.district_id == scoped_dist)
    if scoped_vill:
        stmt = stmt.where(RegionalPotential.village_id == scoped_vill)
    rows = (await db.execute(stmt)).all()
    data = [
        {
            "id": p.id,
            "title": p.title,
            "category_name": c.name,
            "village_name": v.name if v else "-",
            "metric_value": p.metric_value,
            "metric_unit": p.metric_unit,
            "period_year": p.period_year,
        }
        for p, c, v in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/potensi/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_potential(
    payload: PotentialCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    vill_id = resolve_village_scope(current_user, payload.village_id)

    if not vill_id and payload.village_name:
        stmt_v = select(MasterVillage).where(MasterVillage.name.ilike(f"%{payload.village_name.strip()}%"))
        if dist_id:
            stmt_v = stmt_v.where(MasterVillage.district_id == dist_id)
        found_v = (await db.execute(stmt_v)).scalars().first()
        if found_v:
            vill_id = found_v.id
            if not dist_id:
                dist_id = found_v.district_id

    if not dist_id:
        def_dist = (await db.execute(select(MasterDistrict).where(MasterDistrict.is_default.is_(True)))).scalars().first()
        dist_id = def_dist.id if def_dist else (await db.execute(select(MasterDistrict))).scalars().first().id

    cat_id = payload.category_id
    if not cat_id:
        if payload.category_name:
            found_c = (
                await db.execute(
                    select(MasterPotentialCategory).where(
                        MasterPotentialCategory.name.ilike(f"%{payload.category_name.strip()}%")
                    )
                )
            ).scalars().first()
            if found_c:
                cat_id = found_c.id
        if not cat_id:
            first_c = (await db.execute(select(MasterPotentialCategory))).scalars().first()
            cat_id = first_c.id if first_c else "cat-pertanian"

    crud = CRUDBase(RegionalPotential)
    obj = await crud.create(
        db,
        obj_in={
            "district_id": dist_id,
            "village_id": vill_id,
            "category_id": cat_id,
            "title": payload.title.strip(),
            "description": payload.description,
            "metric_value": payload.metric_value,
            "metric_unit": payload.metric_unit,
            "period_year": payload.period_year,
            "created_by": current_user.id,
            "updated_by": current_user.id,
        },
    )
    return {"success": True, "message": "Potensi ditambahkan", "data": {"id": obj.id, "title": obj.title}}


@router.delete("/potensi/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_potential(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    crud = CRUDBase(RegionalPotential)
    obj = await crud.get(db, item_id)
    if not obj:
        raise AppError("Potensi tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, obj.district_id)
    if current_user.role_code == "operator_desa" and obj.village_id != current_user.village_id:
        raise AppError("Akses ditolak.", code="FORBIDDEN", status_code=403)
    await crud.delete(db, db_obj=obj)
    return {"success": True, "message": "Potensi dihapus", "data": {"id": item_id}}


@router.get("/wisata/read")
async def read_tourism(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(TouristDestination, MasterTourismCategory, MasterVillage)
        .join(MasterTourismCategory, TouristDestination.category_id == MasterTourismCategory.id)
        .outerjoin(MasterVillage, TouristDestination.village_id == MasterVillage.id)
    )
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(TouristDestination.district_id == scoped_dist)
    rows = (await db.execute(stmt)).all()
    data = [
        {
            "id": t.id,
            "name": t.name,
            "category_name": c.name,
            "village_name": v.name if v else "-",
            "opening_hours": t.opening_hours,
            "ticket_info": t.ticket_info,
            "cover_image_url": t.cover_image_url,
        }
        for t, c, v in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/wisata/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_tourism(
    payload: TourismCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    vill_id = resolve_village_scope(current_user, payload.village_id)

    if not vill_id and payload.village_name:
        stmt_v = select(MasterVillage).where(MasterVillage.name.ilike(f"%{payload.village_name.strip()}%"))
        if dist_id:
            stmt_v = stmt_v.where(MasterVillage.district_id == dist_id)
        found_v = (await db.execute(stmt_v)).scalars().first()
        if found_v:
            vill_id = found_v.id
            if not dist_id:
                dist_id = found_v.district_id

    if not dist_id:
        def_dist = (await db.execute(select(MasterDistrict).where(MasterDistrict.is_default.is_(True)))).scalars().first()
        dist_id = def_dist.id if def_dist else (await db.execute(select(MasterDistrict))).scalars().first().id

    cat_id = payload.category_id
    if not cat_id:
        if payload.category_name:
            found_c = (
                await db.execute(
                    select(MasterTourismCategory).where(
                        MasterTourismCategory.name.ilike(f"%{payload.category_name.strip()}%")
                    )
                )
            ).scalars().first()
            if found_c:
                cat_id = found_c.id
        if not cat_id:
            first_c = (await db.execute(select(MasterTourismCategory))).scalars().first()
            cat_id = first_c.id if first_c else "cat-bahari"

    crud = CRUDBase(TouristDestination)
    obj = await crud.create(
        db,
        obj_in={
            "district_id": dist_id,
            "village_id": vill_id,
            "category_id": cat_id,
            "name": payload.name.strip(),
            "description": payload.description,
            "opening_hours": payload.opening_hours,
            "ticket_info": payload.ticket_info,
            "created_by": current_user.id,
            "updated_by": current_user.id,
        },
    )
    return {"success": True, "message": "Destinasi wisata ditambahkan", "data": {"id": obj.id, "name": obj.name}}


@router.delete("/wisata/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_tourism(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    crud = CRUDBase(TouristDestination)
    obj = await crud.get(db, item_id)
    if not obj:
        raise AppError("Destinasi wisata tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, obj.district_id)
    if current_user.role_code == "operator_desa" and obj.village_id != current_user.village_id:
        raise AppError("Akses ditolak.", code="FORBIDDEN", status_code=403)
    await crud.delete(db, db_obj=obj)
    return {"success": True, "message": "Destinasi wisata dihapus", "data": {"id": item_id}}
