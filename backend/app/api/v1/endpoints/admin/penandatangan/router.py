"""Penandatanganan surat layanan oleh Camat (TTE)."""

import io
import re
from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field, SecretStr, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles, write_audit_log
from app.core.config import get_settings
from app.core.crypto import encrypt_text, mask_nik
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.core.rate_limit import signing_limiter
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterServiceType, MasterVillage
from app.models.operational import (
    OutgoingLetter,
    ServiceRequest,
    SigningTransaction,
)
from app.services.service_workflow import REVIEW_ROLES, SIGNER_ROLES
from app.services.signing_service import (
    build_letter_pdf,
    refresh_transaction,
    sign_requests,
    signer_nik,
)

router = APIRouter(prefix="/penandatangan", tags=["Penandatanganan TTE"])

_NIK_RE = re.compile(r"^[0-9]{16}$")
MAX_BATCH = 20


class NikPayload(BaseModel):
    nik: str

    @field_validator("nik")
    @classmethod
    def _nik(cls, v: str) -> str:
        v = v.strip()
        if not _NIK_RE.match(v):
            raise ValueError("NIK harus terdiri dari 16 digit angka.")
        return v


class SignPayload(BaseModel):
    request_ids: list[str] = Field(min_length=1, max_length=MAX_BATCH)
    # SecretStr agar tidak tampil pada repr/log.
    passphrase: SecretStr = Field(min_length=1, max_length=256)


def _tte_state() -> dict:
    s = get_settings()
    mode = s.TTE_MODE.lower()
    ready = mode == "mock" or (mode == "live" and bool(s.TTE_BASE_URL and s.TTE_CLIENT_ID and s.TTE_CLIENT_SECRET))
    if mode == "mock" and s.APP_ENV.lower() == "production":
        ready = False
    return {"mode": mode, "ready": ready}


@router.get("/status")
async def status(current_user: User = Depends(require_roles(*SIGNER_ROLES))):
    nik = await signer_nik(current_user)
    return {
        "success": True,
        "message": "OK",
        "data": {
            "tte": _tte_state(),
            "signer": {
                "full_name": current_user.full_name,
                "nip": current_user.nip,
                "has_nik": bool(nik),
                "nik_masked": mask_nik(nik) if nik else None,
            },
        },
    }


@router.put("/nik", dependencies=[Depends(verify_csrf)])
async def set_nik(
    payload: NikPayload,
    request: Request,
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    current_user.signer_nik_encrypted = encrypt_text(payload.nik)
    await db.commit()
    await write_audit_log(
        db, user=current_user, action="UPDATE", entity_type="users", entity_id=current_user.id,
        summary="Memperbarui NIK penandatangan TTE", request=request,
    )
    return {"success": True, "message": "NIK penandatangan disimpan", "data": {"nik_masked": mask_nik(payload.nik)}}


@router.delete("/nik", dependencies=[Depends(verify_csrf)])
async def delete_nik(
    request: Request,
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    current_user.signer_nik_encrypted = None
    await db.commit()
    await write_audit_log(
        db, user=current_user, action="UPDATE", entity_type="users", entity_id=current_user.id,
        summary="Menghapus NIK penandatangan TTE", request=request,
    )
    return {"success": True, "message": "NIK penandatangan dihapus", "data": None}


@router.get("/antrean")
async def queue(
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(ServiceRequest, MasterServiceType.name)
            .join(MasterServiceType, MasterServiceType.id == ServiceRequest.service_type_id)
            .where(
                ServiceRequest.district_id == current_user.district_id,
                ServiceRequest.status == "menunggu_ttd",
            )
            .order_by(ServiceRequest.verified_at.asc())
        )
    ).all()
    items = []
    for sr, srv_name in rows:
        village = (
            (await db.execute(select(MasterVillage).where(MasterVillage.id == sr.village_id)))
            .scalar_one_or_none()
            if sr.village_id
            else None
        )
        last = (
            await db.execute(
                select(SigningTransaction)
                .where(SigningTransaction.service_request_id == sr.id)
                .order_by(SigningTransaction.created_at.desc())
            )
        ).scalars().first()
        items.append(
            {
                "id": sr.id,
                "registration_number": sr.registration_number,
                "applicant_name": sr.applicant_name,
                "service_type_name": srv_name,
                "village_name": village.name if village else "-",
                "verified_at": sr.verified_at,
                "last_attempt": (
                    {"id": last.id, "status": last.status, "message": last.error_message, "at": last.created_at}
                    if last and last.status != "succeeded"
                    else None
                ),
            }
        )
    return {"success": True, "message": "OK", "data": items}


async def _scoped_request(db: AsyncSession, user: User, request_id: str) -> ServiceRequest:
    sr = (
        await db.execute(select(ServiceRequest).where(ServiceRequest.id == request_id))
    ).scalar_one_or_none()
    if not sr or sr.status == "draf" or (user.role_code != "superadmin_kab" and sr.district_id != user.district_id):
        raise AppError("Permohonan tidak ditemukan.", code="NOT_FOUND", status_code=404)
    return sr


@router.get("/{request_id}/pratinjau")
async def preview(
    request_id: str,
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    sr = await _scoped_request(db, current_user, request_id)
    letter = (
        await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
    ).scalar_one_or_none()
    pdf = await build_letter_pdf(db, sr, current_user, letter=letter)
    await db.commit()  # menyimpan kode verifikasi bila baru dibuat
    return StreamingResponse(
        io.BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="pratinjau-{sr.registration_number}.pdf"'},
    )


@router.post("/tandatangani", dependencies=[Depends(verify_csrf)])
async def sign(
    payload: SignPayload,
    request: Request,
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    signing_limiter.check(f"sign:{current_user.id}")
    results = await sign_requests(db, current_user, payload.request_ids, payload.passphrase.get_secret_value())
    ok = sum(1 for r in results if r["status"] == "succeeded")
    # Catatan audit memuat hitungan dan nomor registrasi saja, tidak pernah passphrase.
    await write_audit_log(
        db, user=current_user, action="SIGN", entity_type="service_requests",
        entity_id=payload.request_ids[0],
        summary=f"Penandatanganan TTE: {ok} berhasil dari {len(results)} surat",
        request=request,
    )
    return {"success": True, "message": f"{ok} dari {len(results)} surat berhasil ditandatangani", "data": results}


@router.post("/transaksi/{transaction_id}/periksa", dependencies=[Depends(verify_csrf)])
async def check_transaction(
    transaction_id: str,
    current_user: User = Depends(require_roles(*SIGNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    data = await refresh_transaction(db, current_user, transaction_id)
    return {"success": True, "message": data["message"], "data": data}


@router.get("/{request_id}/surat")
async def signed_letter(
    request_id: str,
    current_user: User = Depends(require_roles(*REVIEW_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Unduh surat yang sudah ditandatangani (petugas kecamatan)."""
    sr = await _scoped_request(db, current_user, request_id)
    letter = (
        await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
    ).scalar_one_or_none()
    if sr.status != "selesai" or not letter or not letter.scan_file_path:
        raise AppError("Surat belum ditandatangani.", code="NOT_FOUND", status_code=404)
    path = Path(letter.scan_file_path).resolve()
    if not path.is_relative_to((get_settings().storage_path / "private").resolve()) or not path.is_file():
        raise AppError("Berkas surat tidak ditemukan.", code="NOT_FOUND", status_code=404)
    safe_name = letter.letter_number.replace("/", "-")
    return FileResponse(
        path, media_type="application/pdf", filename=f"{safe_name}.pdf",
        headers={"X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"},
    )

