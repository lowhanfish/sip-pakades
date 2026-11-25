from datetime import UTC, datetime
import re
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles, resolve_district_scope
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterDistrict
from app.models.operational import GovernmentAnnouncement, GovernmentRegulation

router = APIRouter(prefix="/publikasi", tags=["Admin Publikasi"])


class BeritaCreatePayload(BaseModel):
    district_id: str | None = None
    title: str
    category: str = "berita"
    excerpt: str = ""
    content: str
    thumbnail_url: str | None = None
    status: str = "terbit"


class RegulasiCreatePayload(BaseModel):
    district_id: str | None = None
    title: str
    regulation_number: str
    year: int = 2026
    category: str = "SOP Pelayanan"
    description: str = ""
    status: str = "terbit"


async def _resolve_target_district(current_user: User, requested_id: str | None, db: AsyncSession) -> str:
    scoped = resolve_district_scope(current_user, requested_id)
    if scoped:
        return scoped
    default_dist = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.is_default.is_(True)))
    ).scalar_one_or_none()
    if default_dist:
        return default_dist.id
    first_dist = (await db.execute(select(MasterDistrict))).scalars().first()
    if not first_dist:
        raise AppError("Kecamatan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return first_dist.id


def _slugify(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{base[:180]}-{uuid.uuid4().hex[:6]}"


@router.get("/berita/read")
async def read_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(GovernmentAnnouncement)
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(GovernmentAnnouncement.district_id == scoped_dist)
    rows = (await db.execute(stmt.order_by(GovernmentAnnouncement.published_at.desc(), GovernmentAnnouncement.created_at.desc()))).scalars().all()
    data = [
        {
            "id": a.id,
            "district_id": a.district_id,
            "title": a.title,
            "slug": a.slug,
            "category": a.category,
            "excerpt": a.excerpt or "",
            "content": a.content,
            "thumbnail_url": a.thumbnail_url,
            "status": a.status,
            "published_at": a.published_at or a.created_at,
        }
        for a in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/berita/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_announcement(
    payload: BeritaCreatePayload,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan", "kasi_pelayanan", "operator_desa")),
    db: AsyncSession = Depends(get_db),
):
    dist_id = await _resolve_target_district(current_user, payload.district_id, db)
    now = datetime.now(UTC)
    item = GovernmentAnnouncement(
        id=str(uuid.uuid4()),
        district_id=dist_id,
        title=payload.title.strip(),
        slug=_slugify(payload.title),
        category=payload.category,
        excerpt=payload.excerpt.strip() or payload.content[:140],
        content=payload.content.strip(),
        thumbnail_url=payload.thumbnail_url or "/img/berita-rakor.webp",
        status=payload.status or "terbit",
        published_at=now if (payload.status or "terbit") == "terbit" else None,
        created_by=current_user.id,
    )
    db.add(item)
    await db.commit()
    return {
        "success": True,
        "message": "Berita berhasil dipublikasikan.",
        "data": {"id": item.id, "slug": item.slug, "thumbnail_url": item.thumbnail_url},
    }


@router.delete("/berita/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_announcement(
    item_id: str,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan", "kasi_pelayanan")),
    db: AsyncSession = Depends(get_db),
):
    item = (await db.execute(select(GovernmentAnnouncement).where(GovernmentAnnouncement.id == item_id))).scalar_one_or_none()
    if not item:
        raise AppError("Berita tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, item.district_id)
    await db.delete(item)
    await db.commit()
    return {"success": True, "message": "Berita berhasil dihapus."}


@router.get("/regulasi/read")
async def read_regulations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(GovernmentRegulation)
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(GovernmentRegulation.district_id == scoped_dist)
    rows = (await db.execute(stmt.order_by(GovernmentRegulation.year.desc()))).scalars().all()
    data = [
        {
            "id": r.id,
            "title": r.title,
            "regulation_number": r.regulation_number,
            "year": r.year,
            "category": r.category,
            "description": r.description,
            "status": r.status,
        }
        for r in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/regulasi/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_regulation(
    payload: RegulasiCreatePayload,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    dist_id = await _resolve_target_district(current_user, payload.district_id, db)
    item = GovernmentRegulation(
        id=str(uuid.uuid4()),
        district_id=dist_id,
        title=payload.title.strip(),
        regulation_number=payload.regulation_number.strip(),
        year=payload.year,
        category=payload.category,
        description=payload.description.strip(),
        status=payload.status or "terbit",
        created_by=current_user.id,
    )
    db.add(item)
    await db.commit()
    return {"success": True, "message": "Regulasi berhasil ditambahkan.", "data": {"id": item.id}}


@router.delete("/regulasi/delete/{item_id}", dependencies=[Depends(verify_csrf)])
async def delete_regulation(
    item_id: str,
    current_user: User = Depends(require_roles("superadmin_kab", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    item = (await db.execute(select(GovernmentRegulation).where(GovernmentRegulation.id == item_id))).scalar_one_or_none()
    if not item:
        raise AppError("Regulasi tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, item.district_id)
    await db.delete(item)
    await db.commit()
    return {"success": True, "message": "Regulasi berhasil dihapus."}
