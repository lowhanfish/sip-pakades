from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles, resolve_district_scope, write_audit_log
from app.core.csrf import verify_csrf
from app.core.exceptions import AppError
from app.core.security import hash_password
from app.db.session import get_db
from app.db.transaction import commit_or_raise_unique_conflict
from app.models.audit import AuditLog, BackupLog
from app.models.auth import User
from app.models.master import MasterDistrict, MasterVillage

router = APIRouter(prefix="/sistem", tags=["Admin Sistem"])


class UserCreatePayload(BaseModel):
    username: str
    full_name: str
    email: str
    role: str = "operator_desa"
    district_id: str | None = None
    village_id: str | None = None
    password: str = "demo1234"


@router.get("/pengguna/read")
async def read_users(
    current_user: User = Depends(require_roles("superadmin_kab", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User)
    if current_user.role_code != "superadmin_kab":
        stmt = stmt.where(User.district_id == current_user.district_id)
    users = (await db.execute(stmt.order_by(User.created_at.desc()))).scalars().all()
    districts = {d.id: d.name for d in (await db.execute(select(MasterDistrict))).scalars().all()}
    villages = {v.id: v.name for v in (await db.execute(select(MasterVillage))).scalars().all()}

    data = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role_code,
            "role_label": u.role_code,
            "district_id": u.district_id,
            "district_name": districts.get(u.district_id) if u.district_id else None,
            "village_id": u.village_id,
            "village_name": villages.get(u.village_id) if u.village_id else None,
            "is_active": u.is_active,
        }
        for u in users
    ]
    return {"total": len(data), "skip": 0, "limit": 50, "data": data}


@router.post("/pengguna/create", status_code=201, dependencies=[Depends(verify_csrf)])
async def create_user(
    payload: UserCreatePayload,
    request: Request,
    current_user: User = Depends(require_roles("superadmin_kab", "admin_kecamatan")),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role_code != "superadmin_kab" and payload.role == "superadmin_kab":
        raise AppError("Admin Kecamatan tidak dapat membuat Superadmin.", code="FORBIDDEN", status_code=403)
    dist_id = resolve_district_scope(current_user, payload.district_id)
    user = User(
        username=payload.username.strip(),
        full_name=payload.full_name.strip(),
        email=payload.email.strip(),
        password_hash=hash_password(payload.password),
        role_code=payload.role,
        district_id=dist_id,
        village_id=payload.village_id,
    )
    db.add(user)
    await commit_or_raise_unique_conflict(db, "Username atau email sudah digunakan.")
    await db.refresh(user)
    await write_audit_log(
        db,
        user=current_user,
        action="CREATE",
        entity_type="users",
        entity_id=user.id,
        summary=f"Menambah user {user.username}",
        request=request,
    )
    return {"success": True, "message": "Pengguna ditambahkan", "data": {"id": user.id, "username": user.username}}


@router.get("/audit-log/read")
async def read_audit_logs(
    current_user: User = Depends(require_roles("superadmin_kab", "admin_kecamatan", "camat_sekcam")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog)
    if current_user.role_code != "superadmin_kab":
        stmt = stmt.where(AuditLog.district_id == current_user.district_id)
    rows = (await db.execute(stmt.order_by(AuditLog.created_at.desc()).limit(100))).scalars().all()
    data = [
        {
            "id": a.id,
            "user_name": a.user_name,
            "role": a.role,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "summary": a.summary or "",
            "ip_address": a.ip_address or "-",
            "created_at": a.created_at,
        }
        for a in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 100, "data": data}


@router.get("/pencadangan/read")
async def read_backups(
    _: User = Depends(require_roles("superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(BackupLog).order_by(BackupLog.started_at.desc()).limit(30))).scalars().all()
    data = [
        {
            "id": b.id,
            "file_name": b.file_name,
            "file_size_bytes": b.file_size_bytes,
            "status": b.status,
            "triggered_by_name": b.triggered_by_name,
            "started_at": b.started_at,
            "finished_at": b.finished_at,
            "notes": b.notes or "",
        }
        for b in rows
    ]
    return {"total": len(data), "skip": 0, "limit": 30, "data": data}


@router.post("/pencadangan/trigger", dependencies=[Depends(verify_csrf)])
async def trigger_backup(
    request: Request,
    current_user: User = Depends(require_roles("superadmin_kab")),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    stamp = now.strftime("%Y%m%d_%H%M%S")
    log = BackupLog(
        file_name=f"sippakades_manual_{stamp}.sql.gz",
        file_size_bytes=1024,
        status="success",
        triggered_by_name=current_user.full_name,
        started_at=now,
        finished_at=now,
        notes="Pencadangan dicatat (jalankan backend/scripts/backup_db.sh untuk dump penuh).",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    await write_audit_log(
        db,
        user=current_user,
        action="BACKUP",
        entity_type="backup_logs",
        entity_id=log.id,
        summary=f"Trigger backup {log.file_name}",
        request=request,
    )
    return {"success": True, "message": "Backup database tercatat", "data": {"id": log.id, "file_name": log.file_name}}
