from datetime import date

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles, resolve_district_scope
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.db.session import get_db
from app.models.auth import User
from app.models.master import MasterLetterClassification
from app.models.operational import IncomingLetter, LetterDisposition, OutgoingLetter

router = APIRouter(prefix="/persuratan", tags=["Persuratan Kecamatan"])


class IncomingCreatePayload(BaseModel):
    district_id: str | None = None
    source_village_id: str | None = None
    classification_id: str = "cls-140"
    agenda_number: str | None = None
    origin_letter_number: str
    origin_sender: str
    letter_date: date | None = None
    received_date: date | None = None
    subject: str
    urgency: str = "biasa"


class DispositionPayload(BaseModel):
    target_user_id: str | None = None
    target_user_name: str = "Kasi Pelayanan"
    instruction: str


class OutgoingCreatePayload(BaseModel):
    district_id: str | None = None
    target_village_id: str | None = None
    classification_code: str = "140"
    letter_type: str = "rekomendasi"
    recipient: str
    letter_date: date | None = None
    subject: str
    service_request_id: str | None = None
    letter_number: str | None = None


@router.get("/surat-masuk/read")
async def read_incoming(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(IncomingLetter)
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(IncomingLetter.district_id == scoped_dist)
    rows = (await db.execute(stmt.order_by(IncomingLetter.created_at.desc()))).scalars().all()
    data = []
    for item in rows:
        disps = (
            await db.execute(
                select(LetterDisposition).where(LetterDisposition.incoming_letter_id == item.id)
            )
        ).scalars().all()
        data.append(
            {
                "id": item.id,
                "district_id": item.district_id,
                "agenda_number": item.agenda_number,
                "origin_letter_number": item.origin_letter_number,
                "origin_sender": item.origin_sender,
                "letter_date": item.letter_date,
                "received_date": item.received_date,
                "subject": item.subject,
                "urgency": item.urgency,
                "disposition_status": item.disposition_status,
                "dispositions": [
                    {
                        "id": d.id,
                        "target_user_name": d.target_user_name,
                        "instruction": d.instruction,
                        "status": d.status,
                    }
                    for d in disps
                ],
            }
        )
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/surat-masuk/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_incoming(
    payload: IncomingCreatePayload,
    current_user: User = Depends(require_roles("superadmin_kab", "admin_kecamatan", "kasi_pelayanan")),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    if not dist_id:
        raise AppError("Kecamatan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    count_all = int((await db.execute(select(func.count(IncomingLetter.id)))).scalar_one())
    today = date.today()
    obj = IncomingLetter(
        district_id=dist_id,
        village_id=payload.source_village_id,
        classification_id=payload.classification_id,
        agenda_number=payload.agenda_number or f"AGD-{today.year}-{count_all + 90:03d}",
        origin_letter_number=payload.origin_letter_number,
        origin_sender=payload.origin_sender,
        letter_date=payload.letter_date or today,
        received_date=payload.received_date or today,
        subject=payload.subject,
        urgency=payload.urgency,
        disposition_status="baru",
        created_by=current_user.id,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return {"success": True, "message": "Surat masuk dicatat", "data": {"id": obj.id, "agenda_number": obj.agenda_number}}


@router.post("/surat-masuk/{letter_id}/dispositions", dependencies=[Depends(verify_csrf)])
async def add_disposition(
    letter_id: str,
    payload: DispositionPayload,
    current_user: User = Depends(require_roles("camat_sekcam", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    letter = (
        await db.execute(select(IncomingLetter).where(IncomingLetter.id == letter_id))
    ).scalar_one_or_none()
    if not letter:
        raise AppError("Surat masuk tidak ditemukan.", code="NOT_FOUND", status_code=404)
    resolve_district_scope(current_user, letter.district_id)
    letter.disposition_status = "didisposisikan"
    disp = LetterDisposition(
        incoming_letter_id=letter.id,
        target_user_id=payload.target_user_id,
        target_user_name=payload.target_user_name,
        instruction=payload.instruction,
        status="didisposisikan",
        created_by=current_user.id,
    )
    db.add(disp)
    await db.commit()
    return {"success": True, "message": "Disposisi dikirim", "data": {"id": disp.id}}


@router.get("/surat-keluar/read")
async def read_outgoing(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(OutgoingLetter)
    scoped_dist = resolve_district_scope(current_user, None)
    if scoped_dist:
        stmt = stmt.where(OutgoingLetter.district_id == scoped_dist)
    rows = (await db.execute(stmt.order_by(OutgoingLetter.created_at.desc()))).scalars().all()
    data = [
        {
            "id": o.id,
            "letter_number": o.letter_number,
            "letter_type": o.letter_type,
            "recipient": o.recipient,
            "letter_date": o.letter_date,
            "subject": o.subject,
            "created_at": o.created_at,
        }
        for o in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.get("/surat-keluar/next-number")
async def next_outgoing_number(
    classification_code: str = Query("140"),
    year: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    count_all = int((await db.execute(select(func.count(OutgoingLetter.id)))).scalar_one())
    seq = count_all + 42
    return {
        "success": True,
        "message": "OK",
        "data": {"letter_number": f"{classification_code}/{seq:03d}/KEC-LAEYA/XI/{year}", "sequence_number": seq},
    }


@router.post("/surat-keluar/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_outgoing(
    payload: OutgoingCreatePayload,
    current_user: User = Depends(require_roles("superadmin_kab", "admin_kecamatan", "kasi_pelayanan", "camat_sekcam")),
    db: AsyncSession = Depends(get_db),
):
    dist_id = resolve_district_scope(current_user, payload.district_id) or current_user.district_id
    if not dist_id:
        raise AppError("Kecamatan wajib dipilih.", code="VALIDATION_ERROR", status_code=422)
    cls_obj = (
        await db.execute(
            select(MasterLetterClassification).where(
                MasterLetterClassification.code == payload.classification_code
            )
        )
    ).scalar_one_or_none()
    cls_id = cls_obj.id if cls_obj else "cls-140"

    count_all = int((await db.execute(select(func.count(OutgoingLetter.id)))).scalar_one())
    today = date.today()
    letter_no = payload.letter_number or f"{payload.classification_code}/{count_all + 42:03d}/KEC-LAEYA/XI/{today.year}"
    obj = OutgoingLetter(
        district_id=dist_id,
        village_id=payload.target_village_id,
        classification_id=cls_id,
        service_request_id=payload.service_request_id,
        letter_number=letter_no,
        letter_type=payload.letter_type,
        recipient=payload.recipient,
        letter_date=payload.letter_date or today,
        subject=payload.subject,
        created_by=current_user.id,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return {"success": True, "message": "Surat keluar dicatat", "data": {"id": obj.id, "letter_number": obj.letter_number}}
