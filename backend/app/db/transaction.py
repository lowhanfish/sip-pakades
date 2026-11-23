from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError


async def commit_or_raise_unique_conflict(
    db: AsyncSession,
    conflict_message: str = "Data dengan kode atau identitas tersebut sudah ada.",
) -> None:
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise AppError(
            message=conflict_message,
            code="CONFLICT",
            status_code=409,
        ) from exc
