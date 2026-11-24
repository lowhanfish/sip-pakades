from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.rate_limit import limit_track_requests
from app.db.session import get_db
from app.models.master import (
    MasterDistrict,
    MasterOfficialPosition,
    MasterPotentialCategory,
    MasterServiceType,
    MasterTourismCategory,
    MasterVillage,
)
from app.models.operational import (
    GovernmentAnnouncement,
    GovernmentOfficial,
    GovernmentRegulation,
    OutgoingLetter,
    RegionalPotential,
    ServiceOffering,
    ServiceRequest,
    ServiceStatusHistory,
    TouristDestination,
)

router = APIRouter(prefix="/publish", tags=["Publish"])


def _mask_name(full_name: str) -> str:
    parts = [p for p in full_name.strip().split() if p]
    return " ".join(f"{p[0]}***" for p in parts) if parts else "***"


@router.get("/districts")
async def publish_districts(
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MasterDistrict)
    if active_only:
        stmt = stmt.where(MasterDistrict.is_active.is_(True))
    rows = (await db.execute(stmt.order_by(MasterDistrict.name.asc()))).scalars().all()
    counts = dict(
        (
            await db.execute(
                select(MasterVillage.district_id, func.count(MasterVillage.id))
                .where(MasterVillage.is_active.is_(True))
                .group_by(MasterVillage.district_id)
            )
        ).all()
    )
    data = [
        {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "slug": d.slug,
            "office_address": d.office_address,
            "is_active": d.is_active,
            "is_default": d.is_default,
            "village_count": int(counts.get(d.id, 0)),
        }
        for d in rows
    ]
    return {"success": True, "message": "OK", "data": data}


@router.get("/districts/{slug}/overview")
async def publish_overview(slug: str, db: AsyncSession = Depends(get_db)):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        raise AppError("Kecamatan tidak ditemukan.", code="NOT_FOUND", status_code=404)

    villages_count = int(
        (
            await db.execute(
                select(func.count(MasterVillage.id)).where(
                    MasterVillage.district_id == district.id, MasterVillage.is_active.is_(True)
                )
            )
        ).scalar_one()
    )
    officials = (
        await db.execute(
            select(GovernmentOfficial, MasterOfficialPosition)
            .join(MasterOfficialPosition, GovernmentOfficial.position_id == MasterOfficialPosition.id)
            .where(
                GovernmentOfficial.district_id == district.id,
                GovernmentOfficial.village_id.is_(None),
                GovernmentOfficial.is_active.is_(True),
            )
            .order_by(MasterOfficialPosition.sort_order.asc())
        )
    ).all()

    leader_obj = next((o for o, p in officials if p.is_leadership), None)
    leader = (
        {
            "full_name": leader_obj.full_name,
            "position_name": f"Camat {district.name}",
            "nip": leader_obj.nip,
            "photo_url": leader_obj.photo_url or "/img/camat-laeya.webp",
            "welcome_message": leader_obj.welcome_message
            or f"Selamat datang di Portal Resmi Kecamatan {district.name}.",
        }
        if leader_obj
        else {
            "full_name": f"Camat {district.name}",
            "position_name": f"Camat {district.name}",
            "nip": None,
            "photo_url": None,
            "welcome_message": f"Selamat datang di Portal Resmi Pemerintah Kecamatan {district.name}.",
        }
    )

    potentials_count = int(
        (
            await db.execute(
                select(func.count(RegionalPotential.id)).where(
                    RegionalPotential.district_id == district.id
                )
            )
        ).scalar_one()
    )
    tourism_count = int(
        (
            await db.execute(
                select(func.count(TouristDestination.id)).where(
                    TouristDestination.district_id == district.id
                )
            )
        ).scalar_one()
    )
    completed_services = int(
        (
            await db.execute(
                select(func.count(ServiceRequest.id)).where(
                    ServiceRequest.district_id == district.id,
                    ServiceRequest.status == "selesai",
                )
            )
        ).scalar_one()
    )

    return {
        "success": True,
        "message": "OK",
        "data": {
            "district": {
                "id": district.id,
                "code": district.code,
                "name": district.name,
                "slug": district.slug,
                "office_address": district.office_address,
                "phone": district.phone,
                "email": district.email,
                "service_hours": district.service_hours,
                "vision": district.vision,
                "mission": district.mission,
                "latitude": district.latitude,
                "longitude": district.longitude,
                "is_active": district.is_active,
                "is_default": district.is_default,
            },
            "logo_url": "/img/logo-konsel.webp",
            "leader": leader,
            "org_structure": [
                {"position": p.name, "name": o.full_name, "nip": o.nip} for o, p in officials
            ],
            "stats": {
                "total_villages": villages_count,
                "total_officials": len(officials),
                "total_potentials": potentials_count,
                "total_tourism": tourism_count,
                "total_services_completed": completed_services,
            },
        },
    }


@router.get("/districts/{slug}/villages")
async def publish_villages(
    slug: str,
    search: str = Query(""),
    type: str = Query(""),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        return {"total": 0, "skip": skip, "limit": limit, "data": []}

    stmt = select(MasterVillage).where(
        MasterVillage.district_id == district.id, MasterVillage.is_active.is_(True)
    )
    if type:
        stmt = stmt.where(MasterVillage.type == type)
    if search.strip():
        stmt = stmt.where(MasterVillage.name.ilike(f"%{search.strip()}%"))

    total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
    rows = (await db.execute(stmt.order_by(MasterVillage.code.asc()).offset(skip).limit(limit))).scalars().all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [
            {
                "id": v.id,
                "district_id": v.district_id,
                "code": v.code,
                "name": v.name,
                "slug": v.slug,
                "type": v.type,
                "description": v.description,
                "area_km2": v.area_km2,
                "dusun_count": v.dusun_count,
                "rw_count": v.rw_count,
                "rt_count": v.rt_count,
                "population_total": v.population_total,
                "household_total": v.household_total,
                "latitude": v.latitude,
                "longitude": v.longitude,
            }
            for v in rows
        ],
    }


@router.get("/districts/{slug}/villages/{village_id}")
async def publish_village_detail(slug: str, village_id: str, db: AsyncSession = Depends(get_db)):
    village = (
        await db.execute(select(MasterVillage).where(MasterVillage.id == village_id))
    ).scalar_one_or_none()
    if not village:
        raise AppError("Desa/Kelurahan tidak ditemukan.", code="NOT_FOUND", status_code=404)

    officials = (
        await db.execute(
            select(GovernmentOfficial, MasterOfficialPosition)
            .join(MasterOfficialPosition, GovernmentOfficial.position_id == MasterOfficialPosition.id)
            .where(GovernmentOfficial.village_id == village.id, GovernmentOfficial.is_active.is_(True))
        )
    ).all()
    return {
        "success": True,
        "message": "OK",
        "data": {
            "village": {
                "id": village.id,
                "code": village.code,
                "name": village.name,
                "type": village.type,
                "description": village.description,
                "dusun_count": village.dusun_count,
                "rw_count": village.rw_count,
                "rt_count": village.rt_count,
                "population_total": village.population_total,
                "household_total": village.household_total,
            },
            "officials": [
                {"position_name": p.name, "full_name": o.full_name} for o, p in officials
            ],
            "potentials": [],
            "tourism": [],
        },
    }


@router.get("/districts/{slug}/potentials")
async def publish_potentials(
    slug: str,
    search: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        return {"success": True, "message": "OK", "data": {"items": [], "total": 0, "chart_summary": []}}

    rows = (
        await db.execute(
            select(RegionalPotential, MasterPotentialCategory, MasterVillage)
            .join(MasterPotentialCategory, RegionalPotential.category_id == MasterPotentialCategory.id)
            .outerjoin(MasterVillage, RegionalPotential.village_id == MasterVillage.id)
            .where(RegionalPotential.district_id == district.id, RegionalPotential.is_published.is_(True))
        )
    ).all()
    items = []
    summary: dict[str, dict] = {}
    for p, cat, v in rows:
        if search.strip() and search.strip().lower() not in p.title.lower():
            continue
        items.append(
            {
                "id": p.id,
                "district_id": p.district_id,
                "village_id": p.village_id,
                "village_name": v.name if v else district.name,
                "category_id": p.category_id,
                "category_name": cat.name,
                "title": p.title,
                "description": p.description or "",
                "metric_value": p.metric_value,
                "metric_unit": p.metric_unit,
                "period_year": p.period_year,
            }
        )
        if cat.name not in summary:
            summary[cat.name] = {
                "category_name": cat.name,
                "count": 0,
                "total_value": 0.0,
                "unit": p.metric_unit,
            }
        summary[cat.name]["count"] += 1
        summary[cat.name]["total_value"] += p.metric_value

    return {
        "success": True,
        "message": "OK",
        "data": {"items": items, "total": len(items), "chart_summary": list(summary.values())},
    }


@router.get("/districts/{slug}/tourism")
async def publish_tourism(slug: str, db: AsyncSession = Depends(get_db)):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        return {"total": 0, "skip": 0, "limit": 12, "data": []}
    rows = (
        await db.execute(
            select(TouristDestination, MasterTourismCategory, MasterVillage)
            .join(MasterTourismCategory, TouristDestination.category_id == MasterTourismCategory.id)
            .outerjoin(MasterVillage, TouristDestination.village_id == MasterVillage.id)
            .where(TouristDestination.district_id == district.id, TouristDestination.is_published.is_(True))
        )
    ).all()
    data = [
        {
            "id": t.id,
            "district_id": t.district_id,
            "village_id": t.village_id,
            "village_name": v.name if v else district.name,
            "category_name": cat.name,
            "name": t.name,
            "description": t.description or "",
            "address": t.address or "",
            "facilities": t.facilities or [],
            "opening_hours": t.opening_hours or "-",
            "ticket_info": t.ticket_info or "-",
            "cover_image_url": t.cover_image_url,
            "latitude": t.latitude or 0,
            "longitude": t.longitude or 0,
        }
        for t, cat, v in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 12, "data": data}


@router.get("/districts/{slug}/announcements")
async def publish_announcements(slug: str, db: AsyncSession = Depends(get_db)):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        return {"total": 0, "skip": 0, "limit": 9, "data": []}
    rows = (
        await db.execute(
            select(GovernmentAnnouncement)
            .where(
                GovernmentAnnouncement.district_id == district.id,
                GovernmentAnnouncement.status == "terbit",
            )
            .order_by(GovernmentAnnouncement.published_at.desc())
        )
    ).scalars().all()
    data = [
        {
            "id": a.id,
            "district_id": a.district_id,
            "slug": a.slug,
            "title": a.title,
            "category": a.category,
            "excerpt": a.excerpt or "",
            "content": a.content,
            "thumbnail_url": a.thumbnail_url,
            "published_at": a.published_at or a.created_at,
        }
        for a in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 9, "data": data}


@router.get("/districts/{slug}/regulations")
async def publish_regulations(slug: str, db: AsyncSession = Depends(get_db)):
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.slug == slug))
    ).scalar_one_or_none()
    if not district:
        return {"total": 0, "skip": 0, "limit": 20, "data": []}
    rows = (
        await db.execute(
            select(GovernmentRegulation).where(
                GovernmentRegulation.district_id == district.id,
                GovernmentRegulation.status == "terbit",
            )
        )
    ).scalars().all()
    data = [
        {
            "id": r.id,
            "district_id": r.district_id,
            "title": r.title,
            "regulation_number": r.regulation_number,
            "year": r.year,
            "category": r.category,
            "description": r.description or "",
        }
        for r in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 20, "data": data}


@router.get("/services/types")
async def publish_service_types(
    district_id: str | None = None, db: AsyncSession = Depends(get_db)
):
    # Hanya layanan yang sudah diaktifkan Camat (lihat ServiceOffering) yang boleh tayang.
    stmt = (
        select(MasterServiceType)
        .join(ServiceOffering, ServiceOffering.service_type_id == MasterServiceType.id)
        .where(MasterServiceType.is_active.is_(True), ServiceOffering.is_active.is_(True))
        .distinct()
    )
    if district_id:
        stmt = stmt.where(ServiceOffering.district_id == district_id)
    rows = (await db.execute(stmt)).scalars().all()
    return {
        "success": True,
        "message": "OK",
        "data": [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "description": s.description or "",
                "sla_days": s.sla_days,
                "requirements": s.requirements or [],
            }
            for s in rows
        ],
    }


@router.get("/services/track/{registration_number}", dependencies=[Depends(limit_track_requests)])
async def publish_track_service(registration_number: str, db: AsyncSession = Depends(get_db)):
    reg_clean = registration_number.strip().upper()
    possible_codes = [reg_clean]
    sr = (
        await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.registration_number.in_(possible_codes),
                ServiceRequest.status != "draf",
            )
        )
    ).scalar_one_or_none()
    if not sr:
        raise AppError(
            f'Nomor registrasi "{registration_number}" tidak ditemukan.',
            code="NOT_FOUND",
            status_code=404,
        )
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.id == sr.district_id))
    ).scalar_one_or_none()
    village = (
        await db.execute(select(MasterVillage).where(MasterVillage.id == sr.village_id))
    ).scalar_one_or_none()
    srv_type = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one_or_none()
    histories = (
        await db.execute(
            select(ServiceStatusHistory)
            .where(ServiceStatusHistory.service_request_id == sr.id)
            .order_by(ServiceStatusHistory.changed_at.asc())
        )
    ).scalars().all()

    return {
        "success": True,
        "message": "Status permohonan ditemukan",
        "data": {
            "registration_number": sr.registration_number,
            "district_name": district.name if district else "-",
            "village_name": (
                f"{'Kel.' if village.type == 'kelurahan' else 'Desa'} {village.name}"
                if village
                else "-"
            ),
            "service_type_name": srv_type.name if srv_type else "-",
            "applicant_name_masked": _mask_name(sr.applicant_name),
            "status": sr.status,
            "sla_days": sr.sla_days,
            "sla_due_at": sr.sla_due_at,
            "submitted_at": sr.created_at,
            "updated_at": sr.updated_at,
            "timeline": [
                {
                    "status": h.status,
                    "public_note": h.public_note or h.note or "",
                    "changed_at": h.changed_at,
                }
                for h in histories
            ],
        },
    }


@router.get("/verifikasi/{code}", dependencies=[Depends(limit_track_requests)])
async def publish_verify_letter(code: str, db: AsyncSession = Depends(get_db)):
    """Pemeriksaan keaslian surat dari kode pada QR. Hanya surat yang sudah ditandatangani yang valid."""
    sr = (
        await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.verification_code == code.strip().upper(),
                ServiceRequest.status == "selesai",
            )
        )
    ).scalar_one_or_none()
    letter = (
        (
            await db.execute(
                select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id)
            )
        ).scalar_one_or_none()
        if sr
        else None
    )
    if not sr or not letter:
        raise AppError("Kode verifikasi tidak ditemukan atau surat belum ditandatangani.", code="NOT_FOUND", status_code=404)
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.id == sr.district_id))
    ).scalar_one_or_none()
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one_or_none()
    return {
        "success": True,
        "message": "Surat terdaftar dan sah",
        "data": {
            "valid": True,
            "letter_number": letter.letter_number,
            "service_type_name": srv.name if srv else "-",
            "district_name": district.name if district else "-",
            "applicant_name_masked": _mask_name(sr.applicant_name),
            "signed_at": sr.completed_at,
        },
    }
