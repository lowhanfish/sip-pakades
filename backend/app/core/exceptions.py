from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 400,
        errors: list[dict[str, str]] | None = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.errors = errors
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "code": exc.code,
                "errors": exc.errors,
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        code_map = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "VALIDATION_ERROR",
            429: "RATE_LIMITED",
        }
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": str(exc.detail),
                "code": code_map.get(exc.status_code, "INTERNAL_ERROR"),
                "errors": None,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        errs = [
            {
                "field": ".".join(str(x) for x in e.get("loc", []) if x != "body"),
                # Pydantic menambahkan awalan "Value error, " pada pesan validator buatan sendiri.
                "message": str(e.get("msg", "Input tidak valid")).removeprefix("Value error, "),
            }
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": errs[0]["message"] if errs else "Validasi input gagal",
                "code": "VALIDATION_ERROR",
                "errors": errs,
            },
        )
