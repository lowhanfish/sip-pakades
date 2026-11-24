from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.citizen import Citizen

CITIZEN_ACCESS_TYPE = "citizen_access"
CITIZEN_REFRESH_TYPE = "citizen_refresh"


async def get_current_citizen(
    db: AsyncSession = Depends(get_db),
    access_token: str | None = Cookie(default=None, alias="citizen_access_token"),
) -> Citizen:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi belum terautentikasi.",
        )
    try:
        payload = decode_token(access_token)
        if payload.get("type") != CITIZEN_ACCESS_TYPE:
            raise ValueError("Invalid token type")
        citizen_id = payload.get("sub")
        if not citizen_id:
            raise ValueError("Missing sub")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sesi tidak valid atau kedaluwarsa.",
        ) from exc

    citizen = (
        await db.execute(select(Citizen).where(Citizen.id == citizen_id))
    ).scalar_one_or_none()
    if not citizen or not citizen.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun tidak ditemukan atau nonaktif.",
        )
    return citizen
