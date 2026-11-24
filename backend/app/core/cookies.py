from fastapi import Response

from app.core.config import get_settings


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
) -> None:
    settings = get_settings()
    samesite = settings.COOKIE_SAMESITE
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/v1/auth")
    response.delete_cookie("csrf_token", path="/")


CITIZEN_AUTH_PATH = "/api/v1/masyarakat/auth"


def set_citizen_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
) -> None:
    """Cookie warga memakai nama berbeda dari cookie petugas agar sesi tidak saling menimpa."""
    settings = get_settings()
    samesite = settings.COOKIE_SAMESITE
    response.set_cookie(
        key="citizen_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="citizen_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=CITIZEN_AUTH_PATH,
    )
    response.set_cookie(
        key="citizen_csrf_token",
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,  # type: ignore[arg-type]
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def clear_citizen_cookies(response: Response) -> None:
    response.delete_cookie("citizen_access_token", path="/")
    response.delete_cookie("citizen_refresh_token", path=CITIZEN_AUTH_PATH)
    response.delete_cookie("citizen_csrf_token", path="/")
