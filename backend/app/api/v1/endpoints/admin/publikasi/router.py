from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, resolve_district_scope
from app.db.session import get_db
from app.models.auth import User
from app.models.operational import GovernmentAnnouncement, GovernmentRegulation

router = APIRouter(prefix="/publikasi", tags=["Admin Publikasi"])


@router.get("/berita/read")
async def read_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(GovernmentAnnouncement)
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(GovernmentAnnouncement.district_id == scoped_dist)
    rows = (await db.execute(stmt.order_by(GovernmentAnnouncement.created_at.desc()))).scalars().all()
    data = [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "category": a.category,
            "excerpt": a.excerpt,
            "status": a.status,
            "published_at": a.published_at or a.created_at,
        }
        for a in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 20, "data": data}


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
    return {"total": len(data), "skip": 0, "limit": 20, "data": data}
