"""Enkripsi data sensitif (mis. NIK) dan hash pencarian yang tidak dapat dibalik."""

import base64
import hashlib
import hmac
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _fallback_secret() -> bytes:
    settings = get_settings()
    if settings.APP_ENV.lower() == "production":
        raise RuntimeError("DATA_ENCRYPTION_KEY wajib diisi pada lingkungan production.")
    return settings.JWT_SECRET_KEY.encode("utf-8")


@lru_cache
def _fernet() -> Fernet:
    key = get_settings().DATA_ENCRYPTION_KEY.strip()
    if key:
        return Fernet(key.encode("utf-8"))
    # Hanya untuk development/test: turunkan kunci dari JWT_SECRET_KEY.
    digest = hashlib.sha256(b"fernet:" + _fallback_secret()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def _hmac_key() -> bytes:
    key = get_settings().DATA_ENCRYPTION_KEY.strip()
    base = key.encode("utf-8") if key else _fallback_secret()
    return hashlib.sha256(b"hmac:" + base).digest()


def encrypt_text(plain: str) -> str:
    return _fernet().encrypt(plain.encode("utf-8")).decode("utf-8")


def decrypt_text(token: str) -> str | None:
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None


def blind_index(value: str) -> str:
    """Hash HMAC-SHA256 deterministik untuk pencarian/keunikan tanpa menyimpan nilai asli."""
    return hmac.new(_hmac_key(), value.encode("utf-8"), hashlib.sha256).hexdigest()


def mask_nik(nik: str) -> str:
    if len(nik) != 16:
        return "*" * len(nik)
    return f"{nik[:4]}{'*' * 8}{nik[-4:]}"


_NIK_FIELD_PREFIX = "enc:"


def pack_nik_field(nik: str) -> str:
    """Bentuk simpan NIK pada kolom permohonan: terenkripsi dengan awalan `enc:`."""
    return _NIK_FIELD_PREFIX + encrypt_text(nik)


def unpack_nik_field(value: str) -> str:
    """Kembalikan NIK dari kolom permohonan. Data lama (teks biasa) dikembalikan apa adanya."""
    if value.startswith(_NIK_FIELD_PREFIX):
        return decrypt_text(value[len(_NIK_FIELD_PREFIX):]) or ""
    return value
