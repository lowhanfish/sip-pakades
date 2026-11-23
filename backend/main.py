from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    (settings.storage_path / "public").mkdir(parents=True, exist_ok=True)
    (settings.storage_path / "private").mkdir(parents=True, exist_ok=True)
    settings.backup_path.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="SIP-PAKADES API",
    version="0.1.0",
    description="Backend FastAPI untuk SIP-PAKADES Kabupaten Konawe Selatan",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")

public_media_dir = Path(settings.STORAGE_DIR).resolve() / "public"
public_media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media/public", StaticFiles(directory=str(public_media_dir)), name="public-media")
