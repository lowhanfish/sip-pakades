from fastapi import APIRouter

from app.api.v1.endpoints.admin.master.router import router as master_router
from app.api.v1.endpoints.admin.pelaporan.router import router as pelaporan_router
from app.api.v1.endpoints.admin.pelayanan.router import router as pelayanan_router
from app.api.v1.endpoints.admin.pemantauan.router import router as pemantauan_router
from app.api.v1.endpoints.admin.pemerintahan.router import router as pemerintahan_router
from app.api.v1.endpoints.admin.persuratan.router import router as persuratan_router
from app.api.v1.endpoints.admin.publikasi.router import router as publikasi_router
from app.api.v1.endpoints.admin.sistem.router import router as sistem_router
from app.api.v1.endpoints.auth.route import router as auth_router
from app.api.v1.endpoints.publish.router import router as publish_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(publish_router)

admin_router = APIRouter(prefix="/admin")
admin_router.include_router(master_router)
admin_router.include_router(pemerintahan_router)
admin_router.include_router(publikasi_router)
admin_router.include_router(pelaporan_router)
admin_router.include_router(pelayanan_router)
admin_router.include_router(persuratan_router)
admin_router.include_router(pemantauan_router)
admin_router.include_router(sistem_router)
api_router.include_router(admin_router)


@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "sip-pakades-backend"}
