from datetime import UTC, datetime

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_roles,
    resolve_district_scope,
    resolve_village_scope,
    write_audit_log,
)
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.db.transaction import commit_or_raise_unique_conflict
from app.models.auth import User
from app.models.master import MasterReportType, MasterVillage, ReportPeriod
from app.models.operational import QuarterlyReport, ReportAttachment, ReportStatusHistory
from app.services.upload_service import save_private_file

router = APIRouter(prefix="/pelaporan/triwulan", tags=["Pelaporan Triwulanan"])


class ReportCreatePayload(BaseModel):
    district_id: str | None = None
    village_id: str | None = None
    report_type_id: str
    period_id: str
    title: str
    summary_payload: dict[str, str | int | float] | None = None
    notes: str | None = None


class ReportVerifyPayload(BaseModel):
    decision: str
    note: str = ""


async def _serialize_report(db: AsyncSession, r: QuarterlyReport) -> dict:
    village = (
        await db.execute(select(MasterVillage).where(MasterVillage.id == r.village_id))
    ).scalar_one_or_none()
    rtype = (
        await db.execute(select(MasterReportType).where(MasterReportType.id == r.report_type_id))
    ).scalar_one_or_none()
    period = (
        await db.execute(select(ReportPeriod).where(ReportPeriod.id == r.period_id))
    ).scalar_one_or_none()
    atts = (
        await db.execute(select(ReportAttachment).where(ReportAttachment.report_id == r.id))
    ).scalars().all()
    hists = (
        await db.execute(
            select(ReportStatusHistory)
            .where(ReportStatusHistory.report_id == r.id)
            .order_by(ReportStatusHistory.changed_at.asc())
        )
    ).scalars().all()

    return {
        "id": r.id,
        "district_id": r.district_id,
        "village_id": r.village_id,
        "village_name": (
            f"{'Kel.' if village.type == 'kelurahan' else 'Desa'} {village.name}"
            if village
            else "-"
        ),
        "report_type_id": r.report_type_id,
        "report_type_name": rtype.name if rtype else "-",
        "period_id": r.period_id,
        "period_year": period.period_year if period else 2026,
        "period_quarter": period.period_quarter if period else 4,
        "period_label": period.name if period else "-",
        "title": r.title,
        "status": r.status,
        "submission_version": r.submission_version,
        "submitted_at": r.submitted_at,
        "revision_note": r.revision_note,
        "summary_payload": r.summary_payload or {},
        "attachments": [
            {
                "id": a.id,
                "doc_label": a.doc_label,
                "file_name": a.file_name,
                "file_size": a.file_size,
                "sha256_hash": a.sha256_hash,
            }
            for a in atts
        ],
        "histories": [
            {
                "from_status": h.from_status,
                "to_status": h.to_status,
                "note": h.note or "",
                "changed_by_name": h.changed_by_name,
                "changed_at": h.changed_at,
                "submission_version": h.submission_version,
            }
            for h in hists
        ],
        "created_by_name": r.created_by or "Petugas",
        "verified_by_name": r.verified_by,
        "updated_at": r.updated_at,
    }


@router.get("/read")
async def read_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    district_id: str | None = Query(None),
    village_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scoped_dist = resolve_district_scope(current_user, district_id)
    scoped_vill = resolve_village_scope(current_user, village_id)

    stmt = select(QuarterlyReport)
    if scoped_dist:
        stmt = stmt.where(QuarterlyReport.district_id == scoped_dist)
    if scoped_vill:
        stmt = stmt.where(QuarterlyReport.village_id == scoped_vill)
    if status:
        stmt = stmt.where(QuarterlyReport.status == status)
    if search.strip():
        stmt = stmt.where(QuarterlyReport.title.ilike(f"%{search.strip()}%"))

    total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
    rows = (
        await db.execute(stmt.order_by(QuarterlyReport.updated_at.desc()).offset(skip).limit(limit))
    ).scalars().all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [await _serialize_report(db, r) for r in rows],
    }


@router.post("/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_report(
    payload: ReportCreatePayload,
    request: Request,
    current_user: User = Depends(require_roles("operator_desa", "camat_sekcam", "admin_kecamatan", "superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    vill_id = resolve_village_scope(current_user, payload.village_id)
    if not vill_id:
        raise AppError("Desa/Kelurahan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    if not dist_id:
        village = (
            await db.execute(select(MasterVillage).where(MasterVillage.id == vill_id))
        ).scalar_one_or_none()
        if not village:
            raise AppError("Desa tidak ditemukan.", code="NOT_FOUND", status_code=404)
        dist_id = village.district_id

    rep = QuarterlyReport(
        district_id=dist_id,
        village_id=vill_id,
        report_type_id=payload.report_type_id,
        period_id=payload.period_id,
        title=payload.title,
        status="draf",
        submission_version=1,
        summary_payload=payload.summary_payload or {},
        notes=payload.notes,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(rep)
    await commit_or_raise_unique_conflict(
        db, "Laporan untuk desa, jenis, dan periode ini sudah ada."
    )
    await db.refresh(rep)

    db.add(
        ReportStatusHistory(
            report_id=rep.id,
            from_status=None,
            to_status="draf",
            note="Draf laporan dibuat",
            submission_version=1,
            changed_by=current_user.id,
            changed_by_name=current_user.full_name,
        )
    )
    await db.commit()
    await write_audit_log(
        db,
        user=current_user,
        action="CREATE",
        entity_type="quarterly_reports",
        entity_id=rep.id,
        summary=f"Membuat draf {rep.title}",
        request=request,
    )
    return {
        "success": True,
        "message": "Draf laporan disimpan",
        "data": await _serialize_report(db, rep),
    }


@router.put("/update/{report_id}", dependencies=[Depends(verify_csrf)])
async def update_report(
    report_id: str,
    payload: ReportCreatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rep = (
        await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == report_id))
    ).scalar_one_or_none()
    if not rep:
        raise AppError("Laporan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, rep.district_id)
    resolve_village_scope(current_user, rep.village_id)
    if rep.status not in ("draf", "perlu_perbaikan"):
        raise AppError(
            "Laporan sedang diperiksa atau sudah terverifikasi dan terkunci.",
            code="LOCKED_RESOURCE",
            status_code=409,
        )
    rep.title = payload.title
    rep.summary_payload = payload.summary_payload or {}
    rep.notes = payload.notes
    rep.updated_by = current_user.id
    await db.commit()
    await db.refresh(rep)
    return {"success": True, "message": "Laporan diperbarui", "data": await _serialize_report(db, rep)}


@router.post("/{report_id}/attachments", dependencies=[Depends(verify_csrf)])
async def upload_attachment(
    report_id: str,
    doc_label: str = Form("Lampiran Resmi"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rep = (
        await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == report_id))
    ).scalar_one_or_none()
    if not rep:
        raise AppError("Laporan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, rep.district_id)
    resolve_village_scope(current_user, rep.village_id)
    if rep.status not in ("draf", "perlu_perbaikan"):
        raise AppError("Laporan terkunci.", code="LOCKED_RESOURCE", status_code=409)

    path, orig_name, size, mime, sha256 = await save_private_file(
        file, "reports", allow_excel=True, max_mb=10
    )
    att = ReportAttachment(
        report_id=rep.id,
        doc_label=doc_label,
        file_name=orig_name,
        file_path=path,
        file_size=size,
        mime_type=mime,
        sha256_hash=sha256,
        uploaded_by=current_user.id,
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return {"success": True, "message": "Lampiran diunggah", "data": {"id": att.id, "sha256_hash": sha256}}


@router.get("/{report_id}/attachments/{att_id}/download")
async def download_attachment(
    report_id: str,
    att_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rep = (
        await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == report_id))
    ).scalar_one_or_none()
    if not rep:
        raise AppError("Laporan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, rep.district_id)
    resolve_village_scope(current_user, rep.village_id)
    att = (
        await db.execute(
            select(ReportAttachment).where(
                ReportAttachment.id == att_id, ReportAttachment.report_id == report_id
            )
        )
    ).scalar_one_or_none()
    if not att:
        raise AppError("Lampiran tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return FileResponse(att.file_path, filename=att.file_name, media_type=att.mime_type)


@router.post("/{report_id}/submit", dependencies=[Depends(verify_csrf)])
async def submit_report(
    report_id: str,
    request: Request,
    current_user: User = Depends(require_roles("operator_desa", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    rep = (
        await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == report_id))
    ).scalar_one_or_none()
    if not rep:
        raise AppError("Laporan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, rep.district_id)
    resolve_village_scope(current_user, rep.village_id)

    if rep.status not in ("draf", "perlu_perbaikan"):
        raise AppError(
            "Laporan sudah diajukan atau terverifikasi.",
            code="INVALID_STATUS_TRANSITION",
            status_code=400,
        )
    old_status = rep.status
    if old_status == "perlu_perbaikan":
        rep.submission_version += 1
    rep.status = "diajukan"
    rep.submitted_at = datetime.now(UTC)
    rep.updated_by = current_user.id

    db.add(
        ReportStatusHistory(
            report_id=rep.id,
            from_status=old_status,
            to_status="diajukan",
            note="Diajukan ke Kecamatan",
            submission_version=rep.submission_version,
            changed_by=current_user.id,
            changed_by_name=current_user.full_name,
        )
    )
    await db.commit()
    await db.refresh(rep)
    await write_audit_log(
        db,
        user=current_user,
        action="STATUS_CHANGE",
        entity_type="quarterly_reports",
        entity_id=rep.id,
        summary=f"Mengajukan laporan v{rep.submission_version}",
        request=request,
    )
    await db.refresh(rep)
    return {
        "success": True,
        "message": "Laporan berhasil diajukan ke Kecamatan",
        "data": await _serialize_report(db, rep),
    }


@router.post("/{report_id}/verify", dependencies=[Depends(verify_csrf)])
async def verify_report(
    report_id: str,
    payload: ReportVerifyPayload,
    request: Request,
    current_user: User = Depends(require_roles("kasi_pelayanan", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    rep = (
        await db.execute(select(QuarterlyReport).where(QuarterlyReport.id == report_id))
    ).scalar_one_or_none()
    if not rep:
        raise AppError("Laporan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, rep.district_id)

    if rep.status != "diajukan":
        raise AppError(
            "Hanya laporan berstatus diajukan yang dapat diverifikasi.",
            code="INVALID_STATUS_TRANSITION",
            status_code=400,
        )
    if payload.decision not in ("terverifikasi", "perlu_perbaikan"):
        raise AppError("Keputusan verifikasi tidak valid.", code="VALIDATION_ERROR", status_code=422)
    if payload.decision == "perlu_perbaikan" and not payload.note.strip():
        raise AppError(
            "Catatan perbaikan wajib diisi saat mengembalikan laporan.",
            code="VALIDATION_ERROR",
            status_code=422,
        )

    rep.status = payload.decision
    rep.revision_note = payload.note.strip() if payload.decision == "perlu_perbaikan" else None
    if payload.decision == "terverifikasi":
        rep.verified_by = current_user.id
        rep.verified_at = datetime.now(UTC)
    rep.updated_by = current_user.id

    db.add(
        ReportStatusHistory(
            report_id=rep.id,
            from_status="diajukan",
            to_status=payload.decision,
            note=payload.note.strip() or "Laporan terverifikasi",
            submission_version=rep.submission_version,
            changed_by=current_user.id,
            changed_by_name=current_user.full_name,
        )
    )
    await db.commit()
    await db.refresh(rep)
    await write_audit_log(
        db,
        user=current_user,
        action="STATUS_CHANGE",
        entity_type="quarterly_reports",
        entity_id=rep.id,
        summary=f"Verifikasi laporan -> {payload.decision}",
        request=request,
    )
    await db.refresh(rep)
    return {
        "success": True,
        "message": f"Status laporan diperbarui menjadi {payload.decision}",
        "data": await _serialize_report(db, rep),
    }
