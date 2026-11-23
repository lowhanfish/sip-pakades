import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, write_audit_log
from app.api.v1.endpoints.auth.schema import LoginRequest, UserProfileOut
from app.core.cookies import clear_auth_cookies, set_auth_cookies
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.core.rate_limit import limit_login_requests
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_csrf_token,
    verify_password,
)
from app.db.session import get_db
from app.models.auth import RefreshSession, Role, User
from app.models.master import MasterDistrict, MasterVillage

router = APIRouter(prefix="/auth", tags=["Auth"])


async def _serialize_user(db: AsyncSession, user: User) -> UserProfileOut:
    role = (await db.execute(select(Role).where(Role.code == user.role_code))).scalar_one_or_none()
    district = (
        (
            await db.execute(
                select(MasterDistrict).where(MasterDistrict.id == user.district_id)
            )
        ).scalar_one_or_none()
        if user.district_id
        else None
    )
    village = (
        (
            await db.execute(
                select(MasterVillage).where(MasterVillage.id == user.village_id)
            )
        ).scalar_one_or_none()
        if user.village_id
        else None
    )
    return UserProfileOut(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        nip=user.nip,
        role=user.role_code,
        role_label=role.name if role else user.role_code,
        district_id=user.district_id,
        district_name=district.name if district else None,
        village_id=user.village_id,
        village_name=village.name if village else None,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
    )


@router.post("/login", dependencies=[Depends(limit_login_requests)])
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(User).where(User.username == payload.username.strip()))
    user = res.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise AppError(
            message="Username atau kata sandi tidak valid.",
            code="UNAUTHORIZED",
            status_code=401,
        )
    if not user.is_active:
        raise AppError(
            message="Akun Anda sedang dinonaktifkan.",
            code="FORBIDDEN",
            status_code=403,
        )

    jti = str(uuid.uuid4())
    access_token = create_access_token(user.id, {"role": user.role_code})
    refresh_token, refresh_exp = create_refresh_token(user.id, jti)
    csrf_token = generate_csrf_token()

    user.last_login_at = datetime.now(UTC)
    db.add(RefreshSession(user_id=user.id, jti=jti, expires_at=refresh_exp))
    await db.commit()

    set_auth_cookies(
        response,
        access_token=access_token,
        refresh_token=refresh_token,
        csrf_token=csrf_token,
    )
    await write_audit_log(
        db,
        user=user,
        action="LOGIN",
        entity_type="users",
        entity_id=user.id,
        summary=f"Login berhasil ({user.username})",
        request=request,
    )
    return {
        "success": True,
        "message": "Autentikasi berhasil",
        "data": {
            "user": (await _serialize_user(db, user)).model_dump(),
            "csrf_token": csrf_token,
            "menus": [],
        },
    }


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    csrf_token = generate_csrf_token()
    return {
        "success": True,
        "message": "Sesi aktif",
        "data": {
            "user": (await _serialize_user(db, current_user)).model_dump(),
            "csrf_token": csrf_token,
            "menus": [],
        },
    }


@router.post("/refresh")
async def refresh_session(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    if not refresh_token:
        raise AppError("Refresh token tidak ditemukan.", code="UNAUTHORIZED", status_code=401)
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token")
        user_id = payload["sub"]
        jti = payload["jti"]
    except Exception as exc:
        raise AppError("Refresh token tidak valid.", code="UNAUTHORIZED", status_code=401) from exc

    sess = (
        await db.execute(select(RefreshSession).where(RefreshSession.jti == jti))
    ).scalar_one_or_none()
    if not sess or sess.revoked:
        raise AppError("Sesi refresh telah dicabut.", code="UNAUTHORIZED", status_code=401)

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not user.is_active:
        raise AppError("User tidak aktif.", code="UNAUTHORIZED", status_code=401)

    sess.revoked = True
    new_jti = str(uuid.uuid4())
    new_access = create_access_token(user.id, {"role": user.role_code})
    new_refresh, new_exp = create_refresh_token(user.id, new_jti)
    csrf_token = generate_csrf_token()
    db.add(RefreshSession(user_id=user.id, jti=new_jti, expires_at=new_exp))
    await db.commit()

    set_auth_cookies(
        response,
        access_token=new_access,
        refresh_token=new_refresh,
        csrf_token=csrf_token,
    )
    return {
        "success": True,
        "message": "Sesi diperbarui",
        "data": {
            "csrf_token": csrf_token,
            "user": (await _serialize_user(db, user)).model_dump(),
        },
    }


@router.post("/logout", dependencies=[Depends(verify_csrf)])
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                await db.execute(
                    update(RefreshSession).where(RefreshSession.jti == jti).values(revoked=True)
                )
                await db.commit()
        except Exception:
            pass
    clear_auth_cookies(response)
    return {"success": True, "message": "Berhasil keluar", "data": None}


@router.post("/logout-all", dependencies=[Depends(verify_csrf)])
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == current_user.id)
        .values(revoked=True)
    )
    await db.commit()
    clear_auth_cookies(response)
    return {"success": True, "message": "Seluruh sesi perangkat dicabut", "data": None}
