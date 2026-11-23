from fastapi import Cookie, Header, HTTPException, Request, status


async def verify_csrf(
    request: Request,
    csrf_cookie: str | None = Cookie(default=None, alias="csrf_token"),
    x_csrf_token: str | None = Header(default=None, alias="X-CSRF-Token"),
) -> None:
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    if not csrf_cookie or not x_csrf_token or csrf_cookie != x_csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token tidak valid atau tidak ditemukan.",
        )
