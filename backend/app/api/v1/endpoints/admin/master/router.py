from fastapi import APIRouter

from app.api.v1.endpoints.admin.master.desa import router as desa_router
from app.api.v1.endpoints.admin.master.kecamatan import router as kecamatan_router
from app.api.v1.endpoints.admin.master.references import (
    jabatan_router,
    jenis_laporan_router,
    jenis_layanan_router,
    kategori_potensi_router,
    kategori_wisata_router,
    klasifikasi_surat_router,
    periode_laporan_router,
)

router = APIRouter(prefix="/master")
router.include_router(kecamatan_router)
router.include_router(desa_router)
router.include_router(jabatan_router)
router.include_router(kategori_potensi_router)
router.include_router(kategori_wisata_router)
router.include_router(jenis_laporan_router)
router.include_router(periode_laporan_router)
router.include_router(jenis_layanan_router)
router.include_router(klasifikasi_surat_router)
