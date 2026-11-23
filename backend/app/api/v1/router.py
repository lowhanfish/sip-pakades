from fastapi import APIRouter

from app.api.v1.endpoints.admin.master.router import router as master_router
from app.api.v1.endpoints.auth.route import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)

admin_router = APIRouter(prefix="/admin")
admin_router.include_router(master_router)
api_router.include_router(admin_router)


@api_router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "sip-pakades-backend"}
