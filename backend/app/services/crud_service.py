from typing import Any, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.transaction import commit_or_raise_unique_conflict

ModelType = TypeVar("ModelType", bound=Base)


class CRUDBase[ModelType: Base]:
    def __init__(self, model: type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> ModelType | None:
        res = await db.execute(select(self.model).where(self.model.id == id))  # type: ignore[attr-defined]
        return res.scalar_one_or_none()

    async def count(self, db: AsyncSession) -> int:
        res = await db.execute(select(func.count()).select_from(self.model))
        return int(res.scalar_one())

    async def create(self, db: AsyncSession, *, obj_in: dict[str, Any]) -> ModelType:
        cols = {c.name for c in self.model.__table__.columns}  # type: ignore[attr-defined]
        clean = {k: v for k, v in obj_in.items() if k in cols}
        obj = self.model(**clean)
        db.add(obj)
        await commit_or_raise_unique_conflict(db)
        await db.refresh(obj)
        return obj

    async def update(
        self, db: AsyncSession, *, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        cols = {c.name for c in self.model.__table__.columns}  # type: ignore[attr-defined]
        for k, v in obj_in.items():
            if k in cols:
                setattr(db_obj, k, v)
        await commit_or_raise_unique_conflict(db)
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, *, db_obj: ModelType) -> None:
        await db.delete(db_obj)
        await commit_or_raise_unique_conflict(
            db,
            conflict_message="Data tidak dapat dihapus karena masih digunakan oleh data lain.",
        )
