from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserProfileOut(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    phone: str | None = None
    nip: str | None = None
    role: str
    role_label: str
    district_id: str | None = None
    district_name: str | None = None
    village_id: str | None = None
    village_name: str | None = None
    avatar_url: str | None = None
    is_active: bool
    last_login_at: datetime | None = None
    created_at: datetime
