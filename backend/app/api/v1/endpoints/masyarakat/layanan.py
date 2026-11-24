"""Layanan untuk warga: katalog, pengajuan, unggah lampiran, riwayat/tracking."""

import re
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps_citizen import get_current_citizen
from app.core.config import get_settings
from app.core.crypto import decrypt_text, mask_nik, pack_nik_field, unpack_nik_field
from app.core.csrf import verify_citizen_csrf
from app.core.exceptions import AppError
from app.core.rate_limit import citizen_upload_limiter
from app.db.session import get_db
from app.models.citizen import Citizen
from app.models.master import MasterDistrict, MasterServiceType, MasterVillage
from app.models.operational import (
    OutgoingLetter,
    ServiceDocument,
    ServiceOffering,
    ServiceRequest,
    ServiceStatusHistory,
)
from app.services.service_policy import validate_form_fields, validate_request_data
from app.services.service_workflow import CITIZEN_EDITABLE
from app.services.upload_service import delete_private_file, save_citizen_document

router = APIRouter(prefix="/masyarakat", tags=["Masyarakat - Layanan"])

MAX_DRAFTS = 10
MAX_DOCS_PER_REQUEST = 12
DRAFT = "draf"
_NIK_RE = re.compile(r"^[0-9]{16}$")
_PHONE_RE = re.compile(r"^\+?[0-9]{8,15}$")


class PermohonanCreate(BaseModel):
    service_type_id: str
    village_id: str | None = None
    applicant_name: str | None = Field(default=None, max_length=150)
    applicant_nik: str | None = None
    applicant_phone: str | None = None
    applicant_address: str | None = Field(default=None, max_length=255)
    village_cover_letter_no: str | None = Field(default=None, max_length=100)
    data: dict[str, Any] = Field(default_factory=dict)

    @field_validator("applicant_nik")
    @classmethod
    def _nik(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        if not _NIK_RE.match(v.strip()):
            raise ValueError("NIK harus terdiri dari 16 digit angka.")
        return v.strip()

    @field_validator("applicant_phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        cleaned = re.sub(r"[\s\-]", "", v.strip())
        if not _PHONE_RE.match(cleaned):
            raise ValueError("Nomor HP tidak valid.")
        return cleaned


class PermohonanUpdate(BaseModel):
    applicant_phone: str | None = None
    applicant_address: str | None = Field(default=None, max_length=255)
    village_cover_letter_no: str | None = Field(default=None, max_length=100)
    data: dict[str, Any] | None = None

    @field_validator("applicant_phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        cleaned = re.sub(r"[\s\-]", "", v.strip())
        if not _PHONE_RE.match(cleaned):
            raise ValueError("Nomor HP tidak valid.")
        return cleaned


# ---------- util ----------

def _required_docs(srv: MasterServiceType) -> list[dict[str, Any]]:
    docs = [dict(d) for d in (srv.requirements or [])]
    if srv.requires_village_letter and not any(d.get("code") == "pengantar_desa" for d in docs):
        docs.insert(
            0,
            {"code": "pengantar_desa", "label": "Surat dari Desa/Kelurahan", "required": True},
        )
    return docs


async def _active_offering(
    db: AsyncSession, district_id: str, type_id: str
) -> tuple[MasterServiceType, ServiceOffering]:
    row = (
        await db.execute(
            select(MasterServiceType, ServiceOffering)
            .join(ServiceOffering, ServiceOffering.service_type_id == MasterServiceType.id)
            .where(
                ServiceOffering.district_id == district_id,
                ServiceOffering.is_active.is_(True),
                MasterServiceType.id == type_id,
                MasterServiceType.is_active.is_(True),
            )
        )
    ).first()
    if not row:
        raise AppError(
            "Layanan tidak tersedia di kecamatan Anda.", code="NOT_FOUND", status_code=404
        )
    return row[0], row[1]


async def _own_request(db: AsyncSession, citizen: Citizen, request_id: str) -> ServiceRequest:
    sr = (
        await db.execute(
            select(ServiceRequest).where(
                ServiceRequest.id == request_id, ServiceRequest.citizen_id == citizen.id
            )
        )
    ).scalar_one_or_none()
    if not sr:  # pemilik berbeda diperlakukan sama dengan tidak ada
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return sr


def _require_draft(sr: ServiceRequest) -> None:
    if sr.status != DRAFT:
        raise AppError(
            "Hanya draf yang dapat dihapus.",
            code="CONFLICT",
            status_code=409,
        )


def _require_editable(sr: ServiceRequest) -> None:
    """Warga hanya boleh mengubah berkas saat draf atau saat petugas meminta perbaikan."""
    if sr.status not in CITIZEN_EDITABLE:
        raise AppError(
            "Permohonan yang sedang diproses tidak dapat diubah.",
            code="CONFLICT",
            status_code=409,
        )


async def _next_registration_number(db: AsyncSession, district: MasterDistrict) -> str:
    year = datetime.now(UTC).year
    prefix = f"SIP-{district.code}-{year}-"
    count = int(
        (
            await db.execute(
                select(func.count(ServiceRequest.id)).where(
                    ServiceRequest.registration_number.like(f"{prefix}%")
                )
            )
        ).scalar_one()
    )
    n = count + 1
    while True:
        candidate = f"{prefix}{n:04d}"
        taken = (
            await db.execute(
                select(ServiceRequest.id).where(ServiceRequest.registration_number == candidate)
            )
        ).scalar_one_or_none()
        if not taken:
            return candidate
        n += 1


async def _serialize(db: AsyncSession, sr: ServiceRequest) -> dict:
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one_or_none()
    village = (
        (await db.execute(select(MasterVillage).where(MasterVillage.id == sr.village_id)))
        .scalar_one_or_none()
        if sr.village_id
        else None
    )
    docs = (
        await db.execute(
            select(ServiceDocument)
            .where(ServiceDocument.service_request_id == sr.id)
            .order_by(ServiceDocument.created_at.asc())
        )
    ).scalars().all()
    hists = (
        await db.execute(
            select(ServiceStatusHistory)
            .where(ServiceStatusHistory.service_request_id == sr.id)
            .order_by(ServiceStatusHistory.changed_at.asc())
        )
    ).scalars().all()
    uploaded = {d.doc_code for d in docs}
    letter = (
        await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
    ).scalar_one_or_none()
    nik = unpack_nik_field(sr.applicant_nik)
    return {
        "id": sr.id,
        "registration_number": None if sr.status == DRAFT else sr.registration_number,
        "status": sr.status,
        "letter_number": letter.letter_number if letter and sr.status == "selesai" else None,
        "has_signed_letter": bool(sr.status == "selesai" and letter and letter.scan_file_path),
        "service_type_id": sr.service_type_id,
        "service_type_name": srv.name if srv else "-",
        "village_id": sr.village_id,
        "village_name": village.name if village else None,
        "applicant_name": sr.applicant_name,
        "applicant_nik_masked": mask_nik(nik) if nik else None,
        "applicant_phone": sr.applicant_phone,
        "applicant_address": sr.applicant_address,
        "village_cover_letter_no": sr.village_cover_letter_no,
        "data": sr.request_payload or {},
        "requires_village_letter": bool(srv and srv.requires_village_letter),
        "form_fields": validate_form_fields(srv.form_fields) if srv else [],
        "required_documents": [
            {**d, "uploaded": d["code"] in uploaded} for d in (_required_docs(srv) if srv else [])
        ],
        "documents": [
            {
                "id": d.id,
                "doc_code": d.doc_code,
                "doc_label": d.doc_label,
                "file_name": d.file_name,
                "file_size": d.file_size,
                "mime_type": d.mime_type,
            }
            for d in docs
        ],
        # Hanya catatan publik; catatan internal petugas tidak dikirim ke warga.
        "timeline": [
            {"status": h.status, "public_note": h.public_note or "", "changed_at": h.changed_at}
            for h in hists
        ],
        "sla_due_at": None if sr.status == DRAFT else sr.sla_due_at,
        "created_at": sr.created_at,
        "updated_at": sr.updated_at,
    }


# ---------- katalog ----------

@router.get("/layanan")
async def catalog(
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(MasterServiceType)
            .join(ServiceOffering, ServiceOffering.service_type_id == MasterServiceType.id)
            .where(
                ServiceOffering.district_id == citizen.district_id,
                ServiceOffering.is_active.is_(True),
                MasterServiceType.is_active.is_(True),
            )
            .order_by(MasterServiceType.code.asc())
        )
    ).scalars().all()
    return {
        "success": True,
        "message": "OK",
        "data": [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "description": s.description or "",
                "category": s.category,
                "sla_days": s.sla_days,
                "requires_village_letter": s.requires_village_letter,
                "form_fields": validate_form_fields(s.form_fields),
                "required_documents": _required_docs(s),
            }
            for s in rows
        ],
    }


# ---------- permohonan ----------

@router.get("/permohonan")
async def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ServiceRequest).where(ServiceRequest.citizen_id == citizen.id)
    total = int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one())
    rows = (
        await db.execute(stmt.order_by(ServiceRequest.created_at.desc()).offset(skip).limit(limit))
    ).scalars().all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [await _serialize(db, r) for r in rows],
    }


@router.get("/permohonan/{request_id}")
async def get_request(
    request_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    return {"success": True, "message": "OK", "data": await _serialize(db, sr)}


@router.post("/permohonan", status_code=201, dependencies=[Depends(verify_citizen_csrf)])
async def create_draft(
    payload: PermohonanCreate,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    srv, _ = await _active_offering(db, citizen.district_id, payload.service_type_id)

    drafts = int(
        (
            await db.execute(
                select(func.count(ServiceRequest.id)).where(
                    ServiceRequest.citizen_id == citizen.id, ServiceRequest.status == DRAFT
                )
            )
        ).scalar_one()
    )
    if drafts >= MAX_DRAFTS:
        raise AppError(
            f"Maksimal {MAX_DRAFTS} draf. Kirim atau hapus draf yang ada.",
            code="CONFLICT",
            status_code=409,
        )

    village_id = payload.village_id or citizen.village_id
    if not village_id:
        raise AppError(
            "Desa/kelurahan wajib dipilih.",
            code="VALIDATION_ERROR",
            status_code=422,
            errors=[{"field": "village_id", "message": "Desa/kelurahan wajib dipilih."}],
        )
    village = (
        await db.execute(
            select(MasterVillage).where(
                MasterVillage.id == village_id,
                MasterVillage.district_id == citizen.district_id,
                MasterVillage.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if not village:
        raise AppError(
            "Desa/kelurahan tidak ditemukan pada kecamatan Anda.",
            code="VALIDATION_ERROR",
            status_code=422,
        )

    nik = payload.applicant_nik or (
        decrypt_text(citizen.nik_encrypted) if citizen.nik_encrypted else None
    )
    if not nik:
        raise AppError(
            "NIK wajib diisi. Lengkapi NIK pada profil atau isi pada formulir.",
            code="VALIDATION_ERROR",
            status_code=422,
            errors=[{"field": "applicant_nik", "message": "NIK wajib diisi."}],
        )

    clean, errors = validate_request_data(srv.form_fields, payload.data)
    if errors:
        raise AppError(errors[0]["message"], code="VALIDATION_ERROR", status_code=422, errors=errors)

    now = datetime.now(UTC)
    sr = ServiceRequest(
        registration_number=f"DRAFT-{uuid.uuid4().hex[:16]}",
        district_id=citizen.district_id,
        village_id=village.id,
        citizen_id=citizen.id,
        service_type_id=srv.id,
        applicant_name=payload.applicant_name or citizen.full_name,
        applicant_nik=pack_nik_field(nik),
        applicant_phone=payload.applicant_phone or citizen.phone,
        applicant_address=payload.applicant_address,
        village_cover_letter_no=payload.village_cover_letter_no,
        status=DRAFT,
        sla_days=srv.sla_days,
        sla_due_at=now + timedelta(days=srv.sla_days),
        request_payload=clean,
        created_by=citizen.id,
        updated_by=citizen.id,
    )
    db.add(sr)
    await db.commit()
    await db.refresh(sr)
    return {"success": True, "message": "Draf permohonan dibuat", "data": await _serialize(db, sr)}


@router.patch("/permohonan/{request_id}", dependencies=[Depends(verify_citizen_csrf)])
async def update_request(
    request_id: str,
    payload: PermohonanUpdate,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    """Ubah isian saat masih draf atau saat petugas meminta perbaikan."""
    sr = await _own_request(db, citizen, request_id)
    _require_editable(sr)
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one()
    given = payload.model_fields_set
    if "data" in given and payload.data is not None:
        clean, errors = validate_request_data(srv.form_fields, payload.data)
        if errors:
            raise AppError(errors[0]["message"], code="VALIDATION_ERROR", status_code=422, errors=errors)
        sr.request_payload = clean
    if "village_cover_letter_no" in given:
        no = (payload.village_cover_letter_no or "").strip()
        if srv.requires_village_letter and not no:
            raise AppError(
                "Nomor surat desa/kelurahan wajib diisi.",
                code="VALIDATION_ERROR",
                status_code=422,
                errors=[{"field": "village_cover_letter_no", "message": "Nomor surat desa/kelurahan wajib diisi."}],
            )
        sr.village_cover_letter_no = no or None
    if "applicant_address" in given:
        sr.applicant_address = (payload.applicant_address or "").strip() or None
    if "applicant_phone" in given:
        sr.applicant_phone = payload.applicant_phone
    sr.updated_by = citizen.id
    await db.commit()
    await db.refresh(sr)
    return {"success": True, "message": "Data permohonan diperbarui", "data": await _serialize(db, sr)}


@router.delete("/permohonan/{request_id}", dependencies=[Depends(verify_citizen_csrf)])
async def delete_draft(
    request_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    _require_draft(sr)
    docs = (
        await db.execute(select(ServiceDocument).where(ServiceDocument.service_request_id == sr.id))
    ).scalars().all()
    for d in docs:
        delete_private_file(d.file_path)
        await db.delete(d)
    await db.delete(sr)
    await db.commit()
    return {"success": True, "message": "Draf dihapus", "data": None}


# ---------- lampiran ----------

@router.post("/permohonan/{request_id}/dokumen", dependencies=[Depends(verify_citizen_csrf)])
async def upload_document(
    request_id: str,
    doc_code: str = Form(..., max_length=50),
    file: UploadFile = File(...),
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    citizen_upload_limiter.check(f"upload:{citizen.id}")
    sr = await _own_request(db, citizen, request_id)
    _require_editable(sr)
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one()
    spec = next((d for d in _required_docs(srv) if d.get("code") == doc_code), None)
    if not spec:
        raise AppError("Jenis berkas tidak dikenal untuk layanan ini.", code="VALIDATION_ERROR", status_code=422)

    existing = (
        await db.execute(select(ServiceDocument).where(ServiceDocument.service_request_id == sr.id))
    ).scalars().all()
    previous = next((d for d in existing if d.doc_code == doc_code), None)
    if not previous and len(existing) >= MAX_DOCS_PER_REQUEST:
        raise AppError(
            f"Maksimal {MAX_DOCS_PER_REQUEST} berkas per permohonan.",
            code="CONFLICT",
            status_code=409,
        )

    path, name, size, mime, sha = await save_citizen_document(file, sr.id)
    if previous:  # satu berkas per jenis: unggahan baru menggantikan yang lama
        delete_private_file(previous.file_path)
        await db.delete(previous)
    doc = ServiceDocument(
        service_request_id=sr.id,
        doc_code=doc_code,
        doc_label=spec.get("label", doc_code),
        file_name=name,
        file_path=path,
        file_size=size,
        mime_type=mime,
        sha256_hash=sha,
        is_private=True,
        uploaded_by=citizen.id,
    )
    db.add(doc)
    await db.commit()
    return {"success": True, "message": "Berkas diunggah", "data": await _serialize(db, sr)}


@router.delete(
    "/permohonan/{request_id}/dokumen/{doc_id}", dependencies=[Depends(verify_citizen_csrf)]
)
async def delete_document(
    request_id: str,
    doc_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    _require_editable(sr)
    doc = (
        await db.execute(
            select(ServiceDocument).where(
                ServiceDocument.id == doc_id, ServiceDocument.service_request_id == sr.id
            )
        )
    ).scalar_one_or_none()
    if not doc:
        raise AppError("Berkas tidak ditemukan.", code="NOT_FOUND", status_code=404)
    delete_private_file(doc.file_path)
    await db.delete(doc)
    await db.commit()
    return {"success": True, "message": "Berkas dihapus", "data": await _serialize(db, sr)}


@router.get("/permohonan/{request_id}/dokumen/{doc_id}/unduh")
async def download_document(
    request_id: str,
    doc_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    doc = (
        await db.execute(
            select(ServiceDocument).where(
                ServiceDocument.id == doc_id, ServiceDocument.service_request_id == sr.id
            )
        )
    ).scalar_one_or_none()
    if not doc:
        raise AppError("Berkas tidak ditemukan.", code="NOT_FOUND", status_code=404)
    path = Path(doc.file_path).resolve()
    if not path.is_relative_to((get_settings().storage_path / "private").resolve()) or not path.is_file():
        raise AppError("Berkas tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return FileResponse(
        path,
        filename=doc.file_name,
        media_type=doc.mime_type,
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
    )


# ---------- surat hasil ----------

@router.get("/permohonan/{request_id}/surat")
async def download_letter(
    request_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    letter = (
        await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
    ).scalar_one_or_none()
    if sr.status != "selesai" or not letter or not letter.scan_file_path:
        raise AppError("Surat belum tersedia.", code="NOT_FOUND", status_code=404)
    path = Path(letter.scan_file_path).resolve()
    if not path.is_relative_to((get_settings().storage_path / "private").resolve()) or not path.is_file():
        raise AppError("Berkas surat tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"{letter.letter_number.replace('/', '-')}.pdf",
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
    )


# ---------- kirim ----------

@router.post("/permohonan/{request_id}/kirim", dependencies=[Depends(verify_citizen_csrf)])
async def submit_request(
    request_id: str,
    citizen: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    sr = await _own_request(db, citizen, request_id)
    _require_editable(sr)
    is_resubmit = sr.status != DRAFT
    # Layanan bisa saja dinonaktifkan Camat setelah draf dibuat.
    srv, _ = await _active_offering(db, sr.district_id, sr.service_type_id)

    problems: list[dict[str, str]] = []
    uploaded = {
        d.doc_code
        for d in (
            await db.execute(
                select(ServiceDocument).where(ServiceDocument.service_request_id == sr.id)
            )
        ).scalars()
    }
    for spec in _required_docs(srv):
        if spec.get("required") and spec["code"] not in uploaded:
            problems.append(
                {"field": spec["code"], "message": f"Berkas wajib belum diunggah: {spec['label']}."}
            )
    if srv.requires_village_letter and not (sr.village_cover_letter_no or "").strip():
        problems.append(
            {"field": "village_cover_letter_no", "message": "Nomor surat desa/kelurahan wajib diisi."}
        )
    _, data_errors = validate_request_data(srv.form_fields, sr.request_payload or {})
    problems.extend(data_errors)
    if problems:
        raise AppError(
            "Permohonan belum lengkap.", code="VALIDATION_ERROR", status_code=422, errors=problems
        )

    now = datetime.now(UTC)
    if not is_resubmit:
        district = (
            await db.execute(select(MasterDistrict).where(MasterDistrict.id == sr.district_id))
        ).scalar_one()
        sr.registration_number = await _next_registration_number(db, district)
        sr.sla_days = srv.sla_days
        sr.sla_due_at = now + timedelta(days=srv.sla_days)
    sr.status = "diterima"
    db.add(
        ServiceStatusHistory(
            service_request_id=sr.id,
            status="diterima",
            note="Diperbaiki oleh warga" if is_resubmit else "Diajukan oleh warga melalui portal",
            public_note=(
                "Perbaikan diterima dan menunggu verifikasi ulang petugas."
                if is_resubmit
                else "Permohonan diterima dan menunggu verifikasi petugas."
            ),
            changed_by=citizen.id,
            changed_by_name=citizen.full_name,
        )
    )
    await db.commit()
    await db.refresh(sr)
    return {
        "success": True,
        "message": (
            f"Perbaikan {sr.registration_number} terkirim"
            if is_resubmit
            else f"Permohonan {sr.registration_number} terkirim"
        ),
        "data": await _serialize(db, sr),
    }
