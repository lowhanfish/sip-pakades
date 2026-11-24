"""Pengaturan katalog layanan per kecamatan (aturan PP 17/2018 Pasal 11)."""

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles, resolve_district_scope, write_audit_log
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterServiceType
from app.models.operational import ServiceOffering
from app.services.service_policy import CRITERIA, evaluate_offering

router = APIRouter(prefix="/pelayanan/layanan", tags=["Katalog Layanan Kecamatan"])

EDIT_ROLES = ("camat_sekcam", "admin_kecamatan", "superadmin_kab")
ACTIVATE_ROLES = ("camat_sekcam", "superadmin_kab")


class OfferingPayload(BaseModel):
    legal_basis: str | None = None
    legal_basis_reviewed_at: date | None = None
    criteria_checks: dict[str, bool] | None = None
    not_village_function: bool | None = None
    notes: str | None = None


def _district(user: User, district_id: str | None) -> str:
    scoped = resolve_district_scope(user, district_id)
    if not scoped:
        raise AppError("Kecamatan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    return scoped


def _problems(srv: MasterServiceType, off: ServiceOffering | None) -> list[str]:
    return evaluate_offering(
        category=srv.category,
        legal_basis=off.legal_basis if off else None,
        legal_basis_reviewed_at=off.legal_basis_reviewed_at if off else None,
        criteria_checks=off.criteria_checks if off else None,
        not_village_function=off.not_village_function if off else False,
    )


def _serialize(srv: MasterServiceType, off: ServiceOffering | None) -> dict:
    return {
        "service_type_id": srv.id,
        "code": srv.code,
        "name": srv.name,
        "description": srv.description,
        "category": srv.category,
        "requires_village_letter": srv.requires_village_letter,
        "sla_days": srv.sla_days,
        "criteria_required": [{"key": k, "label": v} for k, v in CRITERIA.get(srv.category, {}).items()],
        "is_active": bool(off and off.is_active),
        "legal_basis": off.legal_basis if off else None,
        "legal_basis_reviewed_at": off.legal_basis_reviewed_at if off else None,
        "criteria_checks": (off.criteria_checks if off else None) or {},
        "not_village_function": bool(off and off.not_village_function),
        "notes": off.notes if off else None,
        "activated_at": off.activated_at if off else None,
        "problems": _problems(srv, off),
    }


async def _get_pair(db: AsyncSession, district_id: str, type_id: str):
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == type_id))
    ).scalar_one_or_none()
    if not srv:
        raise AppError("Jenis layanan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    off = (
        await db.execute(
            select(ServiceOffering).where(
                ServiceOffering.district_id == district_id,
                ServiceOffering.service_type_id == type_id,
            )
        )
    ).scalar_one_or_none()
    return srv, off


@router.get("")
async def list_offerings(
    district_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dist = _district(current_user, district_id)
    types = (
        await db.execute(select(MasterServiceType).order_by(MasterServiceType.code.asc()))
    ).scalars().all()
    offs = {
        o.service_type_id: o
        for o in (
            await db.execute(select(ServiceOffering).where(ServiceOffering.district_id == dist))
        ).scalars()
    }
    return {"success": True, "message": "OK", "data": [_serialize(t, offs.get(t.id)) for t in types]}


@router.put("/{type_id}", dependencies=[Depends(verify_csrf)])
async def save_offering(
    type_id: str,
    payload: OfferingPayload,
    request: Request,
    district_id: str | None = Query(None),
    current_user: User = Depends(require_roles(*EDIT_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    dist = _district(current_user, district_id)
    srv, off = await _get_pair(db, dist, type_id)
    if not off:
        off = ServiceOffering(district_id=dist, service_type_id=type_id)
        db.add(off)

    data = payload.model_dump(exclude_unset=True)
    allowed_criteria = set(CRITERIA.get(srv.category, {}))
    if "criteria_checks" in data and data["criteria_checks"] is not None:
        unknown = set(data["criteria_checks"]) - allowed_criteria
        if unknown:
            raise AppError(
                f"Kriteria tidak dikenal untuk kategori {srv.category}: {', '.join(sorted(unknown))}.",
                code="VALIDATION_ERROR",
                status_code=422,
            )
    for key, value in data.items():
        setattr(off, key, value)
    off.updated_by = current_user.id

    # Mengubah dasar hukum atau kriteria pada layanan yang sudah tayang menuntut tinjauan ulang.
    if off.is_active:
        off.is_active = False
        off.activated_by = None
        off.activated_at = None
    await db.commit()
    await db.refresh(off)
    await write_audit_log(
        db,
        user=current_user,
        action="UPDATE",
        entity_type="district_service_offerings",
        entity_id=off.id,
        summary=f"Mengubah pengaturan layanan {srv.code}",
        request=request,
    )
    return {"success": True, "message": "Pengaturan layanan disimpan", "data": _serialize(srv, off)}


@router.post("/{type_id}/activate", dependencies=[Depends(verify_csrf)])
async def activate_offering(
    type_id: str,
    request: Request,
    district_id: str | None = Query(None),
    current_user: User = Depends(require_roles(*ACTIVATE_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    dist = _district(current_user, district_id)
    srv, off = await _get_pair(db, dist, type_id)
    problems = _problems(srv, off)
    if problems or not off:
        raise AppError(
            "Layanan belum dapat diaktifkan.",
            code="VALIDATION_ERROR",
            status_code=422,
            errors=[{"field": "activation", "message": m} for m in problems],
        )
    off.is_active = True
    off.activated_by = current_user.id
    off.activated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(off)
    await write_audit_log(
        db,
        user=current_user,
        action="ACTIVATE",
        entity_type="district_service_offerings",
        entity_id=off.id,
        summary=f"Mengaktifkan layanan {srv.code} bagi warga",
        request=request,
    )
    return {"success": True, "message": "Layanan diaktifkan", "data": _serialize(srv, off)}


@router.post("/{type_id}/deactivate", dependencies=[Depends(verify_csrf)])
async def deactivate_offering(
    type_id: str,
    request: Request,
    district_id: str | None = Query(None),
    current_user: User = Depends(require_roles(*EDIT_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    dist = _district(current_user, district_id)
    srv, off = await _get_pair(db, dist, type_id)
    if off and off.is_active:
        off.is_active = False
        off.activated_by = None
        off.activated_at = None
        await db.commit()
        await write_audit_log(
            db,
            user=current_user,
            action="DEACTIVATE",
            entity_type="district_service_offerings",
            entity_id=off.id,
            summary=f"Menonaktifkan layanan {srv.code}",
            request=request,
        )
    return {"success": True, "message": "Layanan dinonaktifkan", "data": _serialize(srv, off)}
