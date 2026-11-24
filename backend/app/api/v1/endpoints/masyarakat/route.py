import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Cookie, Depends, Response
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps_citizen import (
    CITIZEN_ACCESS_TYPE,
    CITIZEN_REFRESH_TYPE,
    get_current_citizen,
)
from app.api.v1.endpoints.masyarakat.schema import (
    CitizenChangePassword,
    CitizenLoginRequest,
    CitizenOut,
    CitizenProfileUpdate,
    CitizenRegisterRequest,
)
from app.core.cookies import clear_citizen_cookies, set_citizen_cookies
from app.core.crypto import blind_index, decrypt_text, encrypt_text, mask_nik
from app.core.csrf import verify_citizen_csrf
from app.core.exceptions import AppError
from app.core.rate_limit import limit_citizen_login, limit_citizen_register
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_csrf_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.citizen import Citizen, CitizenSession
from app.models.master import MasterDistrict, MasterVillage

router = APIRouter(prefix="/masyarakat/auth", tags=["Masyarakat"])

# Dipakai agar waktu respons tidak membedakan email terdaftar atau tidak.
_DUMMY_HASH = hash_password("tidak-dipakai-Dummy123")


async def _serialize(db: AsyncSession, citizen: Citizen) -> dict:
    district = (
        await db.execute(select(MasterDistrict).where(MasterDistrict.id == citizen.district_id))
    ).scalar_one_or_none()
    village = (
        (await db.execute(select(MasterVillage).where(MasterVillage.id == citizen.village_id)))
        .scalar_one_or_none()
        if citizen.village_id
        else None
    )
    nik_plain = decrypt_text(citizen.nik_encrypted) if citizen.nik_encrypted else None
    return CitizenOut(
        id=citizen.id,
        email=citizen.email,
        full_name=citizen.full_name,
        phone=citizen.phone,
        nik_masked=mask_nik(nik_plain) if nik_plain else None,
        district_id=citizen.district_id,
        district_name=district.name if district else None,
        village_id=citizen.village_id,
        village_name=village.name if village else None,
        email_verified=citizen.email_verified_at is not None,
        is_active=citizen.is_active,
        last_login_at=citizen.last_login_at,
        created_at=citizen.created_at,
    ).model_dump(mode="json")


async def _resolve_location(
    db: AsyncSession, district_id: str | None, village_id: str | None
) -> tuple[str, str | None]:
    if district_id:
        district = (
            await db.execute(
                select(MasterDistrict).where(
                    MasterDistrict.id == district_id, MasterDistrict.is_active.is_(True)
                )
            )
        ).scalar_one_or_none()
    else:
        district = (
            await db.execute(
                select(MasterDistrict).where(
                    MasterDistrict.is_default.is_(True), MasterDistrict.is_active.is_(True)
                )
            )
        ).scalars().first()
    if not district:
        raise AppError("Kecamatan tidak ditemukan.", code="VALIDATION_ERROR", status_code=422)

    if village_id:
        village = (
            await db.execute(
                select(MasterVillage).where(
                    MasterVillage.id == village_id,
                    MasterVillage.district_id == district.id,
                    MasterVillage.is_active.is_(True),
                )
            )
        ).scalar_one_or_none()
        if not village:
            raise AppError(
                "Desa/kelurahan tidak ditemukan pada kecamatan yang dipilih.",
                code="VALIDATION_ERROR",
                status_code=422,
            )
    return district.id, village_id


async def _start_session(db: AsyncSession, response: Response, citizen: Citizen) -> str:
    jti = str(uuid.uuid4())
    access = create_access_token(citizen.id, token_type=CITIZEN_ACCESS_TYPE)
    refresh, refresh_exp = create_refresh_token(citizen.id, jti, token_type=CITIZEN_REFRESH_TYPE)
    csrf = generate_csrf_token()
    db.add(CitizenSession(citizen_id=citizen.id, jti=jti, expires_at=refresh_exp))
    await db.commit()
    set_citizen_cookies(response, access_token=access, refresh_token=refresh, csrf_token=csrf)
    return csrf


@router.post("/register", status_code=201, dependencies=[Depends(limit_citizen_register)])
async def register(
    payload: CitizenRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    email = payload.email.lower()
    exists = (
        await db.execute(select(Citizen.id).where(Citizen.email == email))
    ).scalar_one_or_none()
    if exists:
        raise AppError("Email sudah terdaftar.", code="CONFLICT", status_code=409)

    district_id, village_id = await _resolve_location(db, payload.district_id, payload.village_id)
    citizen = Citizen(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        district_id=district_id,
        village_id=village_id,
        last_login_at=datetime.now(UTC),
    )
    db.add(citizen)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError("Email sudah terdaftar.", code="CONFLICT", status_code=409) from exc

    csrf = await _start_session(db, response, citizen)
    return {
        "success": True,
        "message": "Pendaftaran berhasil",
        "data": {"citizen": await _serialize(db, citizen), "csrf_token": csrf},
    }


@router.post("/login", dependencies=[Depends(limit_citizen_login)])
async def login(
    payload: CitizenLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    citizen = (
        await db.execute(select(Citizen).where(Citizen.email == payload.email.lower()))
    ).scalar_one_or_none()
    password_ok = verify_password(
        payload.password, citizen.password_hash if citizen else _DUMMY_HASH
    )
    if not citizen or not password_ok:
        raise AppError(
            "Email atau kata sandi tidak valid.", code="UNAUTHORIZED", status_code=401
        )
    if not citizen.is_active:
        raise AppError("Akun Anda sedang dinonaktifkan.", code="FORBIDDEN", status_code=403)

    citizen.last_login_at = datetime.now(UTC)
    csrf = await _start_session(db, response, citizen)
    return {
        "success": True,
        "message": "Autentikasi berhasil",
        "data": {"citizen": await _serialize(db, citizen), "csrf_token": csrf},
    }


@router.get("/me")
async def me(
    current: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    return {
        "success": True,
        "message": "Sesi aktif",
        "data": {"citizen": await _serialize(db, current), "csrf_token": generate_csrf_token()},
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="citizen_refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise AppError("Refresh token tidak ditemukan.", code="UNAUTHORIZED", status_code=401)
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != CITIZEN_REFRESH_TYPE:
            raise ValueError("Invalid token")
        citizen_id = payload["sub"]
        jti = payload["jti"]
    except Exception as exc:
        raise AppError("Refresh token tidak valid.", code="UNAUTHORIZED", status_code=401) from exc

    sess = (
        await db.execute(select(CitizenSession).where(CitizenSession.jti == jti))
    ).scalar_one_or_none()
    if not sess or sess.citizen_id != citizen_id:
        raise AppError("Sesi refresh tidak dikenali.", code="UNAUTHORIZED", status_code=401)
    if sess.revoked:
        # Token lama dipakai ulang: kemungkinan dicuri, cabut seluruh sesi akun ini.
        await db.execute(
            update(CitizenSession)
            .where(CitizenSession.citizen_id == citizen_id)
            .values(revoked=True)
        )
        await db.commit()
        raise AppError("Sesi refresh telah dicabut.", code="UNAUTHORIZED", status_code=401)

    citizen = (
        await db.execute(select(Citizen).where(Citizen.id == citizen_id))
    ).scalar_one_or_none()
    if not citizen or not citizen.is_active:
        raise AppError("Akun tidak aktif.", code="UNAUTHORIZED", status_code=401)

    sess.revoked = True
    csrf = await _start_session(db, response, citizen)
    return {
        "success": True,
        "message": "Sesi diperbarui",
        "data": {"citizen": await _serialize(db, citizen), "csrf_token": csrf},
    }


@router.post("/logout", dependencies=[Depends(verify_citizen_csrf)])
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="citizen_refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        try:
            jti = decode_token(refresh_token).get("jti")
            if jti:
                await db.execute(
                    update(CitizenSession).where(CitizenSession.jti == jti).values(revoked=True)
                )
                await db.commit()
        except Exception:
            pass
    clear_citizen_cookies(response)
    return {"success": True, "message": "Berhasil keluar", "data": None}


@router.patch("/profile", dependencies=[Depends(verify_citizen_csrf)])
async def update_profile(
    payload: CitizenProfileUpdate,
    current: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data and data["full_name"]:
        current.full_name = data["full_name"]
    if "phone" in data:
        current.phone = data["phone"]
    if "village_id" in data:
        _, village_id = await _resolve_location(db, current.district_id, data["village_id"])
        current.village_id = village_id
    if "nik" in data:
        nik = data["nik"]
        if nik:
            nik_hash = blind_index(nik)
            taken = (
                await db.execute(
                    select(Citizen.id).where(Citizen.nik_hash == nik_hash, Citizen.id != current.id)
                )
            ).scalar_one_or_none()
            if taken:
                raise AppError(
                    "NIK sudah terdaftar pada akun lain.", code="CONFLICT", status_code=409
                )
            current.nik_encrypted = encrypt_text(nik)
            current.nik_hash = nik_hash
        else:
            current.nik_encrypted = None
            current.nik_hash = None
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError("NIK sudah terdaftar pada akun lain.", code="CONFLICT", status_code=409) from exc
    return {
        "success": True,
        "message": "Profil diperbarui",
        "data": {"citizen": await _serialize(db, current)},
    }


@router.post("/change-password", dependencies=[Depends(verify_citizen_csrf)])
async def change_password(
    payload: CitizenChangePassword,
    response: Response,
    current: Citizen = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current.password_hash):
        raise AppError("Kata sandi saat ini salah.", code="UNAUTHORIZED", status_code=401)
    if payload.current_password == payload.new_password:
        raise AppError(
            "Kata sandi baru harus berbeda dari yang lama.",
            code="VALIDATION_ERROR",
            status_code=422,
        )
    current.password_hash = hash_password(payload.new_password)
    # Cabut seluruh sesi di perangkat lain, lalu terbitkan sesi baru untuk perangkat ini.
    await db.execute(
        update(CitizenSession).where(CitizenSession.citizen_id == current.id).values(revoked=True)
    )
    csrf = await _start_session(db, response, current)
    return {
        "success": True,
        "message": "Kata sandi diperbarui",
        "data": {"csrf_token": csrf},
    }
