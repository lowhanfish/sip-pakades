from collections.abc import Callable
from typing import Any

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.auth import User


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    access_token: str | None = Cookie(default=None, alias="access_token"),
) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi belum terautentikasi.",
        )
    try:
        payload = decode_token(access_token)
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing sub")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sesi tidak valid atau kedaluwarsa.",
        ) from exc

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun tidak ditemukan atau nonaktif.",
        )
    return user


def require_roles(*allowed_roles: str) -> Callable[..., Any]:
    async def _guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_code not in allowed_roles:
            raise AppError(
                message="Anda tidak memiliki hak akses untuk operasi ini.",
                code="FORBIDDEN",
                status_code=403,
            )
        return current_user

    return _guard


def resolve_district_scope(current_user: User, requested_district_id: str | None) -> str | None:
    if current_user.role_code == "superadmin_kab":
        return requested_district_id
    if requested_district_id and requested_district_id != current_user.district_id:
        raise AppError(
            message="Akses ditolak: Anda hanya dapat mengakses kecamatan Anda sendiri.",
            code="FORBIDDEN",
            status_code=403,
        )
    return current_user.district_id


def resolve_village_scope(current_user: User, requested_village_id: str | None) -> str | None:
    if current_user.role_code == "operator_desa":
        if requested_village_id and requested_village_id != current_user.village_id:
            raise AppError(
                message="Akses ditolak: Anda hanya dapat mengakses data desa/kelurahan Anda.",
                code="FORBIDDEN",
                status_code=403,
            )
        return current_user.village_id
    return requested_village_id


async def write_audit_log(
    db: AsyncSession,
    *,
    user: User | None,
    action: str,
    entity_type: str,
    entity_id: str,
    summary: str,
    request: Request | None = None,
    before_data: dict[str, Any] | None = None,
    after_data: dict[str, Any] | None = None,
) -> None:
    ip = request.client.host if request and request.client else None
    db.add(
        AuditLog(
            district_id=user.district_id if user else None,
            user_id=user.id if user else None,
            user_name=user.full_name if user else "System",
            role=user.role_code if user else "system",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary,
            before_data=before_data,
            after_data=after_data,
            ip_address=ip,
        )
    )
    await db.commit()
