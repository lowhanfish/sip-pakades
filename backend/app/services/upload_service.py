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


CITIZEN_DOC_MAX_MB = 10
_MAGIC: list[tuple[bytes, str, str]] = [
    (b"%PDF-", ".pdf", "application/pdf"),
    (b"\xff\xd8\xff", ".jpg", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", ".png", "image/png"),
]


def _sniff_document(raw: bytes) -> tuple[str, str] | None:
    for magic, ext, mime in _MAGIC:
        if raw.startswith(magic):
            return ext, mime
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return ".webp", "image/webp"
    return None


async def save_citizen_document(
    file: UploadFile, request_id: str
) -> tuple[str, str, int, str, str]:
    """Simpan lampiran warga. Jenis berkas ditentukan dari isi, bukan dari nama/Content-Type."""
    max_bytes = CITIZEN_DOC_MAX_MB * 1024 * 1024
    raw = await file.read(max_bytes + 1)
    if not raw:
        raise AppError("Berkas kosong.", code="FILE_VALIDATION_ERROR", status_code=422)
    if len(raw) > max_bytes:
        raise AppError(
            f"Ukuran berkas melebihi batas {CITIZEN_DOC_MAX_MB} MB.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    sniffed = _sniff_document(raw)
    if not sniffed:
        raise AppError(
            "Berkas harus berupa PDF, JPG, PNG, atau WebP yang valid.",
            code="FILE_VALIDATION_ERROR",
            status_code=422,
        )
    ext, mime = sniffed
    target_dir = get_settings().storage_path / "private" / "sip_docs" / request_id
    target_dir.mkdir(parents=True, exist_ok=True)
    full_path = target_dir / f"{uuid.uuid4()}{ext}"
    full_path.write_bytes(raw)
    display = Path(file.filename or "berkas").name[:200] or "berkas"
    return str(full_path), display, len(raw), mime, hashlib.sha256(raw).hexdigest()


def delete_private_file(path: str) -> None:
    """Hapus berkas hanya bila berada di dalam direktori penyimpanan private."""
    try:
        p = Path(path).resolve()
        if p.is_relative_to((get_settings().storage_path / "private").resolve()) and p.is_file():
            p.unlink()
    except OSError:
        pass
