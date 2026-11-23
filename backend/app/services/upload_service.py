import hashlib
import io
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import AppError

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_REPORT_EXTS = {".pdf", ".xlsx", ".xls"}


async def save_public_webp_image(file: UploadFile, subdir: str, max_mb: int = 5) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise AppError(
            message="Format gambar harus JPG, PNG, atau WebP.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    raw = await file.read()
    if len(raw) > max_mb * 1024 * 1024:
        raise AppError(
            message=f"Ukuran gambar melebihi batas {max_mb} MB.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    try:
        img = Image.open(io.BytesIO(raw))
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")
        out_buf = io.BytesIO()
        img.save(out_buf, format="WEBP", quality=88, method=6)
    except Exception as exc:
        raise AppError(
            message="File gambar rusak atau tidak valid.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        ) from exc

    settings = get_settings()
    target_dir = settings.storage_path / "public" / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}.webp"
    (target_dir / filename).write_bytes(out_buf.getvalue())
    return f"/media/public/{subdir}/{filename}"


async def save_private_file(
    file: UploadFile,
    subdir: str,
    *,
    allow_excel: bool = False,
    max_mb: int = 5,
) -> tuple[str, str, int, str, str]:
    ext = Path(file.filename or "").suffix.lower()
    allowed = ALLOWED_REPORT_EXTS if allow_excel else ALLOWED_DOC_EXTS
    if ext not in allowed:
        raise AppError(
            message=f"Ekstensi berkas tidak diizinkan ({', '.join(sorted(allowed))}).",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    raw = await file.read()
    if len(raw) > max_mb * 1024 * 1024:
        raise AppError(
            message=f"Ukuran berkas melebihi batas {max_mb} MB.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    sha256_hash = hashlib.sha256(raw).hexdigest()
    settings = get_settings()
    target_dir = settings.storage_path / "private" / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{ext}"
    full_path = target_dir / stored_name
    full_path.write_bytes(raw)
    return (
        str(full_path),
        file.filename or stored_name,
        len(raw),
        file.content_type or "application/octet-stream",
        sha256_hash,
    )
