"""Alur status permohonan layanan.

diterima ──► diproses ──► menunggu_ttd ──► selesai
   │             │             │
   ├─► perlu_kelengkapan ◄─────┘   (warga memperbaiki, lalu kembali ke `diterima`)
   └─► ditolak (dari tahap mana pun sebelum selesai)

`menunggu_ttd` hanya dicapai lewat verifikasi petugas. `selesai` TIDAK dapat diset manual: status itu
hanya diberikan sistem setelah gateway TTE berhasil menandatangani surat (signing_service).
"""

DRAFT = "draf"
CITIZEN_EDITABLE = (DRAFT, "perlu_kelengkapan")

TRANSITIONS: dict[str, tuple[str, ...]] = {
    "diterima": ("diproses", "perlu_kelengkapan", "menunggu_ttd", "ditolak"),
    "diproses": ("perlu_kelengkapan", "menunggu_ttd", "ditolak"),
    "perlu_kelengkapan": ("ditolak",),  # selebihnya menunggu perbaikan dari warga
    "menunggu_ttd": ("perlu_kelengkapan", "ditolak"),
    "selesai": (),
    "ditolak": (),
}

# Peran yang boleh memverifikasi / memutuskan. Hanya Camat yang boleh menandatangani.
REVIEW_ROLES = ("admin_kecamatan", "kasi_pelayanan", "camat_sekcam", "superadmin_kab")
SIGNER_ROLES = ("camat_sekcam",)

NOTE_REQUIRED = {
    "perlu_kelengkapan": "Catatan kekurangan berkas wajib diisi agar warga tahu apa yang diperbaiki.",
    "ditolak": "Alasan penolakan wajib diisi agar warga mengetahuinya.",
}


def allowed_next(status: str) -> tuple[str, ...]:
    return TRANSITIONS.get(status, ())
