import io
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import func, or_, select
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
from app.models.auth import User
from app.models.master import MasterDistrict, MasterServiceType, MasterVillage
from app.models.operational import ServiceDocument, ServiceRequest, ServiceStatusHistory
from app.services.upload_service import save_private_file

router = APIRouter(prefix="/pelayanan", tags=["Pelayanan SIP-PAKADES"])


class ServiceCreatePayload(BaseModel):
    district_id: str | None = None
    village_id: str | None = None
    service_type_id: str
    applicant_name: str
    applicant_nik: str
    applicant_phone: str | None = None
    applicant_address: str | None = None
    village_cover_letter_no: str | None = None
    request_payload: dict | None = None
    notes: str | None = None


class ServiceStatusPayload(BaseModel):
    status: str
    note: str = ""
    public_note: str | None = None


def _mask_nik(nik: str) -> str:
    clean = nik.strip()
    if len(clean) < 8:
        return "******"
    return f"{clean[:6]}******{clean[-4:]}"


async def _serialize_service(db: AsyncSession, s: ServiceRequest) -> dict:
    village = (
        await db.execute(select(MasterVillage).where(MasterVillage.id == s.village_id))
    ).scalar_one_or_none()
    srv_type = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == s.service_type_id))
    ).scalar_one_or_none()
    docs = (
        await db.execute(select(ServiceDocument).where(ServiceDocument.service_request_id == s.id))
    ).scalars().all()
    hists = (
        await db.execute(
            select(ServiceStatusHistory)
            .where(ServiceStatusHistory.service_request_id == s.id)
            .order_by(ServiceStatusHistory.changed_at.asc())
        )
    ).scalars().all()

    return {
        "id": s.id,
        "registration_number": s.registration_number,
        "district_id": s.district_id,
        "village_id": s.village_id,
        "village_name": (
            f"{'Kel.' if village.type == 'kelurahan' else 'Desa'} {village.name}"
            if village
            else "-"
        ),
        "service_type_id": s.service_type_id,
        "service_type_name": srv_type.name if srv_type else "-",
        "applicant_name": s.applicant_name,
        "applicant_nik_masked": _mask_nik(s.applicant_nik),
        "applicant_phone": s.applicant_phone,
        "applicant_address": s.applicant_address,
        "village_cover_letter_no": s.village_cover_letter_no,
        "status": s.status,
        "sla_days": s.sla_days,
        "sla_due_at": s.sla_due_at,
        "notes": s.notes,
        "documents": [
            {
                "id": d.id,
                "doc_code": d.doc_code,
                "doc_label": d.doc_label,
                "file_name": d.file_name,
                "mime_type": d.mime_type,
                "is_private": d.is_private,
            }
            for d in docs
        ],
        "histories": [
            {
                "status": h.status,
                "note": h.note or "",
                "public_note": h.public_note or "",
                "changed_by_name": h.changed_by_name,
                "changed_at": h.changed_at,
            }
            for h in hists
        ],
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


@router.get("/permohonan/read")
async def read_services(
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

    stmt = select(ServiceRequest)
    if scoped_dist:
        stmt = stmt.where(ServiceRequest.district_id == scoped_dist)
    if scoped_vill:
        stmt = stmt.where(ServiceRequest.village_id == scoped_vill)
    if status:
        stmt = stmt.where(ServiceRequest.status == status)
    if search.strip():
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                ServiceRequest.registration_number.ilike(like),
                ServiceRequest.applicant_name.ilike(like),
            )
        )

    total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
    rows = (
        await db.execute(stmt.order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit))
    ).scalars().all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [await _serialize_service(db, r) for r in rows],
    }


@router.post("/permohonan/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_service(
    payload: ServiceCreatePayload,
    request: Request,
    current_user: User = Depends(
        require_roles("kasi_pelayanan", "admin_kecamatan", "operator_desa", "superadmin_kab")
    ),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    vill_id = resolve_village_scope(current_user, payload.village_id)
    if not vill_id:
        raise AppError("Desa/Kelurahan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)

    village = (
        await db.execute(select(MasterVillage).where(MasterVillage.id == vill_id))
    ).scalar_one_or_none()
    if not village:
        raise AppError("Desa tidak ditemukan.", code="NOT_FOUND", status_code=404)
    dist_id = dist_id or village.district_id

    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.id == dist_id))
    ).scalar_one_or_none()
    srv_type = (
        await db.execute(
            select(MasterServiceType).where(MasterServiceType.id == payload.service_type_id)
        )
    ).scalar_one_or_none()
    if not srv_type:
        raise AppError("Jenis layanan tidak ditemukan.", code="NOT_FOUND", status_code=404)

    now = datetime.now(UTC)
    count_all = int((await db.execute(select(func.count(ServiceRequest.id)))).scalar_one())
    dist_code = district.code if district else "740511"
    reg_no = f"SIP-{dist_code}-{now.year}-{count_all + 42:04d}"

    sr = ServiceRequest(
        registration_number=reg_no,
        district_id=dist_id,
        village_id=vill_id,
        service_type_id=srv_type.id,
        applicant_name=payload.applicant_name,
        applicant_nik=payload.applicant_nik,
        applicant_phone=payload.applicant_phone,
        applicant_address=payload.applicant_address,
        village_cover_letter_no=payload.village_cover_letter_no,
        status="diterima",
        sla_days=srv_type.sla_days,
        sla_due_at=now + timedelta(days=srv_type.sla_days),
        request_payload=payload.request_payload or {},
        notes=payload.notes,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(sr)
    await db.flush()
    db.add(
        ServiceStatusHistory(
            service_request_id=sr.id,
            status="diterima",
            note="Permohonan didaftarkan",
            public_note="Permohonan layanan telah diterima di sistem.",
            changed_by=current_user.id,
            changed_by_name=current_user.full_name,
        )
    )
    await db.commit()
    await db.refresh(sr)
    await write_audit_log(
        db,
        user=current_user,
        action="CREATE",
        entity_type="service_requests",
        entity_id=sr.id,
        summary=f"Registrasi SIP-PAKADES {reg_no}",
        request=request,
    )
    return {
        "success": True,
        "message": f"Permohonan {reg_no} terdaftar",
        "data": await _serialize_service(db, sr),
    }


@router.patch("/permohonan/{item_id}/status", dependencies=[Depends(verify_csrf)])
async def update_service_status(
    item_id: str,
    payload: ServiceStatusPayload,
    request: Request,
    current_user: User = Depends(require_roles("kasi_pelayanan", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    sr = (
        await db.execute(select(ServiceRequest).where(ServiceRequest.id == item_id))
    ).scalar_one_or_none()
    if not sr:
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, sr.district_id)

    valid_statuses = ("diterima", "perlu_kelengkapan", "diproses", "selesai")
    if payload.status not in valid_statuses:
        raise AppError("Status pelayanan tidak valid.", code="VALIDATION_ERROR", status_code=422)
    if payload.status == "perlu_kelengkapan" and not payload.note.strip():
        raise AppError("Catatan kekurangan berkas wajib diisi.", code="VALIDATION_ERROR", status_code=422)

    sr.status = payload.status
    if payload.status == "selesai":
        sr.completed_at = datetime.now(UTC)
    sr.updated_by = current_user.id

    db.add(
        ServiceStatusHistory(
            service_request_id=sr.id,
            status=payload.status,
            note=payload.note.strip() or f"Status diubah ke {payload.status}",
            public_note=payload.public_note or payload.note.strip() or f"Status: {payload.status}",
            changed_by=current_user.id,
            changed_by_name=current_user.full_name,
        )
    )
    await db.commit()
    await db.refresh(sr)
    await write_audit_log(
        db,
        user=current_user,
        action="STATUS_CHANGE",
        entity_type="service_requests",
        entity_id=sr.id,
        summary=f"Status SIP-PAKADES {sr.registration_number} -> {payload.status}",
        request=request,
    )
    return {
        "success": True,
        "message": "Status pelayanan diperbarui",
        "data": await _serialize_service(db, sr),
    }


@router.post("/permohonan/{item_id}/documents", dependencies=[Depends(verify_csrf)])
async def upload_private_document(
    item_id: str,
    doc_code: str = Form("ktp_kk"),
    doc_label: str = Form("Dokumen Persyaratan"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sr = (
        await db.execute(select(ServiceRequest).where(ServiceRequest.id == item_id))
    ).scalar_one_or_none()
    if not sr:
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, sr.district_id)
    resolve_village_scope(current_user, sr.village_id)

    path, orig_name, size, mime, sha256 = await save_private_file(
        file, "paten_docs", allow_excel=False, max_mb=5
    )
    doc = ServiceDocument(
        service_request_id=sr.id,
        doc_code=doc_code,
        doc_label=doc_label,
        file_name=orig_name,
        file_path=path,
        file_size=size,
        mime_type=mime,
        sha256_hash=sha256,
        is_private=True,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"success": True, "message": "Dokumen privat diunggah", "data": {"id": doc.id}}


@router.get("/dokumen/{doc_id}/download")
async def download_private_document(
    doc_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = (
        await db.execute(select(ServiceDocument).where(ServiceDocument.id == doc_id))
    ).scalar_one_or_none()
    if not doc:
        raise AppError("Dokumen tidak ditemukan.", code="NOT_FOUND", status_code=404)
    sr = (
        await db.execute(select(ServiceRequest).where(ServiceRequest.id == doc.service_request_id))
    ).scalar_one_or_none()
    if not sr:
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)

    resolve_district_scope(current_user, sr.district_id)
    resolve_village_scope(current_user, sr.village_id)

    await write_audit_log(
        db,
        user=current_user,
        action="DOWNLOAD_PRIVATE_DOC",
        entity_type="service_documents",
        entity_id=doc.id,
        summary=f"Mengunduh dokumen privat {doc.doc_label} ({sr.registration_number})",
        request=request,
    )
    return FileResponse(doc.file_path, filename=doc.file_name, media_type=doc.mime_type)


@router.get("/permohonan/{item_id}/draft-pdf")
async def download_draft_pdf(
    item_id: str,
    current_user: User = Depends(require_roles("kasi_pelayanan", "camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    sr = (
        await db.execute(select(ServiceRequest).where(ServiceRequest.id == item_id))
    ).scalar_one_or_none()
    if not sr:
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, sr.district_id)
    srv_type = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one_or_none()

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(72, 770, "PEMERINTAH KABUPATEN KONAWE SELATAN")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, 752, "KANTOR KECAMATAN LAEYA — PELAYANAN SIP-PAKADES")
    c.line(72, 742, 520, 742)
    c.setFont("Helvetica", 11)
    c.drawString(72, 710, f"Nomor Registrasi : {sr.registration_number}")
    c.drawString(72, 690, f"Jenis Layanan    : {srv_type.name if srv_type else '-'}")
    c.drawString(72, 670, f"Nama Pemohon     : {sr.applicant_name}")
    c.drawString(72, 650, f"Alamat           : {sr.applicant_address or '-'}")
    c.drawString(72, 630, f"Status           : {sr.status.upper()}")
    c.showPage()
    c.save()
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{sr.registration_number}.pdf"'},
    )
