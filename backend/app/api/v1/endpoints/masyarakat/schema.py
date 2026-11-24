import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

_PHONE_RE = re.compile(r"^\+?[0-9]{8,15}$")
_NIK_RE = re.compile(r"^[0-9]{16}$")


def validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Kata sandi minimal 8 karakter.")
    if len(value) > 128:
        raise ValueError("Kata sandi maksimal 128 karakter.")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
        raise ValueError("Kata sandi harus memuat huruf dan angka.")
    return value


def _clean_phone(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"[\s\-]", "", value.strip())
    if not cleaned:
        return None
    if not _PHONE_RE.match(cleaned):
        raise ValueError("Nomor HP tidak valid.")
    return cleaned


class CitizenRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = Field(min_length=3, max_length=150)
    phone: str | None = None
    district_id: str | None = None
    village_id: str | None = None

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        return validate_password_strength(v)

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = " ".join(v.split())
        if len(v) < 3:
            raise ValueError("Nama lengkap minimal 3 karakter.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return _clean_phone(v)


class CitizenLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class CitizenProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=150)
    phone: str | None = None
    nik: str | None = None
    village_id: str | None = None

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = " ".join(v.split())
        if len(v) < 3:
            raise ValueError("Nama lengkap minimal 3 karakter.")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        return _clean_phone(v)

    @field_validator("nik")
    @classmethod
    def _nik(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        v = v.strip()
        if not _NIK_RE.match(v):
            raise ValueError("NIK harus terdiri dari 16 digit angka.")
        return v


class CitizenChangePassword(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _password(cls, v: str) -> str:
        return validate_password_strength(v)


class CitizenOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    nik_masked: str | None = None
    district_id: str
    district_name: str | None = None
    village_id: str | None = None
    village_name: str | None = None
    email_verified: bool
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
