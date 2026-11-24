"""Orkestrasi penandatanganan surat layanan oleh Camat.

Prinsip:
* passphrase hanya melintas sebagai argumen; tidak disimpan, dicatat, atau dikembalikan;
* satu transaksi dicatat SEBELUM memanggil gateway, sehingga gangguan di tengah jalan tetap berjejak;
* hasil `unknown` (timeout/gangguan) tidak pernah diulang otomatis;
* passphrase atau sertifikat ditolak -> seluruh sisa antrean dihentikan agar akun TTE tidak terkunci;
* PDF hasil langsung disimpan di server kita karena gateway hanya menyimpannya ±24 jam.
"""

import hashlib
import secrets
import uuid
from datetime import UTC, date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.crypto import decrypt_text, unpack_nik_field
from app.core.exceptions import AppError
from app.models.auth import User
from app.models.master import (
    MasterDistrict,
    MasterLetterClassification,
    MasterServiceType,
    MasterVillage,
)
from app.models.operational import (
    OutgoingLetter,
    ServiceRequest,
    ServiceStatusHistory,
    SigningTransaction,
)
from app.services.letter_pdf import LetterData, render_letter_pdf, roman_month
from app.services.service_policy import validate_form_fields
from app.services.tte_client import TTEClient, TTEConfigError, get_tte_client

WITA = ZoneInfo("Asia/Makassar")
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # tanpa karakter yang mudah tertukar
FATAL_CODES = {"signer_passphrase_invalid", "signer_certificate_invalid", "gateway_credentials"}


def _out(rid: str, status: str, message: str, **extra) -> dict:
    return {"request_id": rid, "status": status, "message": message, **extra}


def _today() -> date:
    return datetime.now(WITA).date()


def _new_verification_code() -> str:
    return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(12))


async def signer_nik(user: User) -> str | None:
    return decrypt_text(user.signer_nik_encrypted) if user.signer_nik_encrypted else None


async def _get_or_create_letter(
    db: AsyncSession, sr: ServiceRequest, srv: MasterServiceType, district: MasterDistrict, user: User
) -> OutgoingLetter:
    letter = (
        await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
    ).scalar_one_or_none()
    if letter:
        return letter

    cls = (
        (
            await db.execute(
                select(MasterLetterClassification).where(
                    MasterLetterClassification.id == srv.letter_classification_id
                )
            )
        ).scalar_one_or_none()
        if srv.letter_classification_id
        else None
    )
    if not cls:
        raise AppError(
            "Jenis layanan ini belum memiliki klasifikasi surat untuk penomoran.",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    today = _today()
    n = int(
        (
            await db.execute(
                select(func.count(OutgoingLetter.id)).where(
                    OutgoingLetter.district_id == district.id,
                    func.extract("year", OutgoingLetter.letter_date) == today.year,
                )
            )
        ).scalar_one()
    ) + 1
    while True:
        number = f"{cls.code}/{n:03d}/KEC-{district.slug.upper()}/{roman_month(today)}/{today.year}"
        taken = (
            await db.execute(select(OutgoingLetter.id).where(OutgoingLetter.letter_number == number))
        ).scalar_one_or_none()
        if not taken:
            break
        n += 1
    letter = OutgoingLetter(
        district_id=district.id,
        village_id=sr.village_id,
        classification_id=cls.id,
        service_request_id=sr.id,
        letter_number=number,
        letter_type="rekomendasi",
        recipient=sr.applicant_name,
        letter_date=today,
        subject=srv.name,
        summary=f"Surat layanan {sr.registration_number}",
        auto_number=True,
        created_by=user.id,
        updated_by=user.id,
    )
    db.add(letter)
    await db.flush()
    sr.outgoing_letter_id = letter.id
    return letter


async def build_letter_pdf(
    db: AsyncSession, sr: ServiceRequest, user: User, *, letter: OutgoingLetter | None = None
) -> bytes:
    srv = (
        await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))
    ).scalar_one()
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.id == sr.district_id))
    ).scalar_one()
    village = (
        (await db.execute(select(MasterVillage).where(MasterVillage.id == sr.village_id)))
        .scalar_one_or_none()
        if sr.village_id
        else None
    )
    if not sr.verification_code:
        sr.verification_code = _new_verification_code()
        await db.flush()

    labels = {f["key"]: f.get("label", f["key"]) for f in validate_form_fields(srv.form_fields)}
    fields = [(labels.get(k, k.replace("_", " ").capitalize()), v) for k, v in (sr.request_payload or {}).items()]
    base = get_settings().PUBLIC_BASE_URL.rstrip("/")
    return render_letter_pdf(
        LetterData(
            district_name=district.name,
            district_address=district.office_address or "",
            service_name=srv.name,
            letter_number=letter.letter_number if letter else None,
            letter_date=letter.letter_date if letter else _today(),
            applicant_name=sr.applicant_name,
            applicant_nik=unpack_nik_field(sr.applicant_nik),
            applicant_address=sr.applicant_address or "",
            village_name=(("Kel. " if village.type == "kelurahan" else "Desa ") + village.name) if village else "-",
            village_letter_no=sr.village_cover_letter_no,
            fields=fields,
            signer_name=user.full_name,
            signer_nip=user.nip,
            verification_url=f"{base}/verifikasi/{sr.verification_code}",
            verification_code=sr.verification_code,
        )
    )


def _signed_path(request_id: str) -> Path:
    d = get_settings().storage_path / "private" / "signed" / request_id
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{uuid.uuid4()}.pdf"


async def finalize_success(
    db: AsyncSession,
    sr: ServiceRequest,
    tx: SigningTransaction,
    letter: OutgoingLetter,
    signed_pdf: bytes,
    user: User,
) -> None:
    path = _signed_path(sr.id)
    path.write_bytes(signed_pdf)
    now = datetime.now(UTC)
    tx.status = "succeeded"
    tx.active_slot = None
    tx.signed_file_path = str(path)
    tx.signed_sha256 = hashlib.sha256(signed_pdf).hexdigest()
    tx.error_code = None
    tx.error_message = None
    tx.completed_at = now
    letter.scan_file_path = str(path)
    sr.status = "selesai"
    sr.completed_at = now
    sr.updated_by = user.id
    sr.outgoing_letter_id = letter.id
    db.add(
        ServiceStatusHistory(
            service_request_id=sr.id,
            status="selesai",
            note=f"Ditandatangani secara elektronik oleh {user.full_name} ({letter.letter_number})",
            public_note="Surat telah selesai dan ditandatangani secara elektronik. Silakan unduh surat Anda.",
            changed_by=user.id,
            changed_by_name=user.full_name,
        )
    )
    await db.commit()


async def sign_requests(
    db: AsyncSession, user: User, request_ids: list[str], passphrase: str
) -> list[dict]:
    """Tandatangani beberapa surat dengan satu kali passphrase. Mengembalikan hasil per surat."""
    try:
        client: TTEClient = get_tte_client()
    except TTEConfigError as exc:
        raise AppError(str(exc), code="SERVICE_UNAVAILABLE", status_code=503) from exc

    nik = await signer_nik(user)
    if not nik:
        raise AppError(
            "NIK penandatangan belum diisi. Isi dulu di menu Penandatanganan.",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    tag = get_settings().TTE_TAG_COORDINATE
    results: list[dict] = []
    halted: str | None = None

    for rid in dict.fromkeys(request_ids):  # urutan tetap, tanpa duplikat
        sr = (await db.execute(select(ServiceRequest).where(ServiceRequest.id == rid))).scalar_one_or_none()
        if not sr or sr.district_id != user.district_id:
            results.append(_out(rid, "skipped", "Permohonan tidak ditemukan."))
            continue
        if halted:
            results.append(_out(rid, "skipped", halted, registration_number=sr.registration_number))
            continue
        if sr.status != "menunggu_ttd":
            results.append(_out(rid, "skipped", "Surat tidak berstatus menunggu tanda tangan.", registration_number=sr.registration_number))
            continue
        pending = (
            await db.execute(
                select(SigningTransaction).where(
                    SigningTransaction.service_request_id == sr.id,
                    SigningTransaction.status.in_(("sending", "unknown")),
                )
            )
        ).scalars().first()
        if pending:
            results.append(_out(rid,
                "skipped",
                "Ada transaksi sebelumnya yang hasilnya belum pasti. Periksa statusnya terlebih dahulu.",
                registration_number=sr.registration_number, transaction_id=pending.id,
            ))
            continue

        reg_no = sr.registration_number  # dibaca sebelum ada rollback yang mengosongkan atribut
        srv = (await db.execute(select(MasterServiceType).where(MasterServiceType.id == sr.service_type_id))).scalar_one()
        district = (await db.execute(select(MasterDistrict).where(MasterDistrict.id == sr.district_id))).scalar_one()
        try:
            letter = await _get_or_create_letter(db, sr, srv, district, user)
            pdf = await build_letter_pdf(db, sr, user, letter=letter)
        except AppError as exc:
            await db.rollback()
            await db.refresh(user)  # rollback mengosongkan semua objek sesi, termasuk penandatangan
            results.append(_out(rid, "failed", exc.message, registration_number=reg_no))
            continue

        tx = SigningTransaction(
            service_request_id=sr.id,
            requested_by=user.id,
            status="sending",
            active_slot=sr.id,
            idempotency_key=f"sipk-{uuid.uuid4()}",
            unsigned_sha256=hashlib.sha256(pdf).hexdigest(),
        )
        db.add(tx)
        try:
            await db.commit()  # jejak tersimpan sebelum gateway dipanggil
        except IntegrityError:
            # Permintaan lain sedang menandatangani surat yang sama: jangan kirim dua kali.
            await db.rollback()
            await db.refresh(user)
            results.append(_out(rid, "skipped", "Penandatanganan surat ini sedang berjalan di permintaan lain.",
                                registration_number=reg_no))
            continue

        res = await client.sign(pdf=pdf, nik=nik, passphrase=passphrase, tag=tag, idempotency_key=tx.idempotency_key)
        tx.gateway_request_id = res.request_id

        if res.outcome == "succeeded" and res.pdf and res.pdf.startswith(b"%PDF"):
            try:
                await finalize_success(db, sr, tx, letter, res.pdf, user)
            except OSError:
                tx.status = "unknown"
                tx.error_message = "PDF hasil belum tersimpan di server. Periksa status transaksi untuk mengunduh ulang."
                await db.commit()
                results.append(_out(rid, "unknown", tx.error_message, registration_number=sr.registration_number, transaction_id=tx.id))
                continue
            results.append(_out(rid, "succeeded", "Surat berhasil ditandatangani.",
                               registration_number=sr.registration_number, letter_number=letter.letter_number,
                               transaction_id=tx.id))
        elif res.outcome == "unknown":
            tx.status = "unknown"
            tx.error_message = res.message
            await db.commit()
            results.append(_out(rid, "unknown", res.message, registration_number=sr.registration_number, transaction_id=tx.id))
        else:
            tx.status = "failed"
            tx.active_slot = None
            tx.error_code = res.code
            tx.error_message = res.message or "Penandatanganan gagal."
            tx.completed_at = datetime.now(UTC)
            await db.commit()
            results.append(_out(rid, "failed", tx.error_message, registration_number=sr.registration_number,
                               code=res.code, transaction_id=tx.id))
            if res.code in FATAL_CODES or res.retry_signing is False:
                halted = "Dihentikan: " + tx.error_message + " Surat ini tidak diproses agar akun TTE tidak terkunci."
    return results


async def refresh_transaction(db: AsyncSession, user: User, tx_id: str) -> dict:
    """Periksa transaksi yang hasilnya belum pasti; unduh PDF bila gateway menyatakan berhasil."""
    try:
        client = get_tte_client()
    except TTEConfigError as exc:
        raise AppError(str(exc), code="SERVICE_UNAVAILABLE", status_code=503) from exc

    tx = (await db.execute(select(SigningTransaction).where(SigningTransaction.id == tx_id))).scalar_one_or_none()
    sr = (
        (await db.execute(select(ServiceRequest).where(ServiceRequest.id == tx.service_request_id))).scalar_one_or_none()
        if tx
        else None
    )
    if not tx or not sr or sr.district_id != user.district_id:
        raise AppError("Transaksi tidak ditemukan.", code="NOT_FOUND", status_code=404)
    if tx.status not in ("unknown", "sending"):
        return {"status": tx.status, "message": "Transaksi sudah memiliki hasil akhir."}
    if not tx.gateway_request_id:
        return {
            "status": tx.status,
            "message": "ID transaksi gateway belum tercatat. Minta admin gateway menelusuri transaksi dengan "
                       f"Idempotency-Key {tx.idempotency_key}. Jangan menandatangani ulang.",
        }

    gw = await client.status(tx.gateway_request_id)
    if gw.status == "succeeded":
        pdf = await client.download(tx.gateway_request_id)
        letter = (
            await db.execute(select(OutgoingLetter).where(OutgoingLetter.service_request_id == sr.id))
        ).scalar_one()
        if not pdf or not pdf.startswith(b"%PDF"):
            return {"status": "unknown", "message": "Gateway menyatakan berhasil tetapi PDF belum dapat diunduh. Coba lagi."}
        await finalize_success(db, sr, tx, letter, pdf, user)
        return {"status": "succeeded", "message": "Surat berhasil ditandatangani.", "letter_number": letter.letter_number}
    if gw.status == "failed":
        tx.status = "failed"
        tx.active_slot = None
        tx.error_code = gw.error_code
        tx.error_message = "Gateway menyatakan penandatanganan gagal."
        tx.completed_at = datetime.now(UTC)
        await db.commit()
        return {"status": "failed", "message": tx.error_message}
    return {"status": gw.status, "message": "Gateway masih memproses atau hasilnya belum dapat dipastikan. Coba periksa lagi nanti."}
