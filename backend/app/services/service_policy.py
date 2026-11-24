"""Aturan katalog layanan kecamatan.

Dasar: PP 17/2018 tentang Kecamatan, Pasal 11 ayat (3) dan (6). Sebuah layanan hanya boleh
tayang ke warga bila dasar hukumnya tercatat, kriteria pelimpahannya terpenuhi, dan layanan itu
bukan fungsi desa/kelurahan. Yang memutuskan adalah Camat; sistem hanya menolak aktivasi bila
isiannya belum lengkap.
"""

from datetime import date
from typing import Any

CATEGORIES = ("perizinan", "nonperizinan", "rekomendasi", "legalisasi")

CRITERIA: dict[str, dict[str, str]] = {
    # PP 17/2018 Pasal 11 ayat (3): semua kriteria harus terpenuhi.
    "perizinan": {
        "proses_sederhana": "Proses sederhana",
        "skala_kecil": "Objek perizinan berskala kecil",
        "tanpa_kajian_teknis_kompleks": "Tidak memerlukan kajian teknis yang kompleks",
        "tanpa_teknologi_tinggi": "Tidak memerlukan teknologi tinggi",
    },
    # PP 17/2018 Pasal 11 ayat (6): semua kriteria harus terpenuhi.
    "nonperizinan": {
        "terkait_pengawasan_objek_perizinan": "Berkaitan dengan pengawasan terhadap objek perizinan",
        "skala_kecil": "Kegiatan berskala kecil",
        "layanan_langsung_rutin": "Pelayanan langsung pada masyarakat yang bersifat rutin",
    },
    "rekomendasi": {},
    "legalisasi": {},
}

FIELD_TYPES = ("text", "textarea", "date", "number", "select")
DEFAULT_FORM_FIELDS: list[dict[str, Any]] = [
    {"key": "keperluan", "label": "Keperluan Permohonan", "type": "textarea", "required": True}
]


def evaluate_offering(
    *,
    category: str,
    legal_basis: str | None,
    legal_basis_reviewed_at: date | None,
    criteria_checks: dict[str, bool] | None,
    not_village_function: bool,
    today: date | None = None,
) -> list[str]:
    """Kembalikan daftar kekurangan. Kosong berarti layanan boleh diaktifkan."""
    today = today or date.today()
    problems: list[str] = []
    if not (legal_basis or "").strip():
        problems.append("Dasar hukum (nomor dan tahun peraturan) belum diisi.")
    if legal_basis_reviewed_at is None:
        problems.append("Tanggal tinjauan dasar hukum belum diisi.")
    elif legal_basis_reviewed_at > today:
        problems.append("Tanggal tinjauan dasar hukum tidak boleh di masa depan.")
    if not not_village_function:
        problems.append("Belum ada pernyataan bahwa layanan ini bukan fungsi desa/kelurahan.")
    checks = criteria_checks or {}
    for key, label in CRITERIA.get(category, {}).items():
        if not checks.get(key):
            problems.append(f"Kriteria belum terpenuhi: {label}.")
    return problems


def validate_form_fields(fields: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    return fields if fields else DEFAULT_FORM_FIELDS


def validate_request_data(
    fields: list[dict[str, Any]] | None, data: dict[str, Any]
) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """Cocokkan isian warga dengan definisi form. Isian di luar definisi dibuang."""
    defs = validate_form_fields(fields)
    clean: dict[str, Any] = {}
    errors: list[dict[str, str]] = []
    for f in defs:
        key = f["key"]
        label = f.get("label", key)
        raw = data.get(key)
        text = "" if raw is None else str(raw).strip()
        if not text:
            if f.get("required"):
                errors.append({"field": key, "message": f"{label} wajib diisi."})
            continue
        max_len = int(f.get("max_length") or (2000 if f.get("type") == "textarea" else 255))
        if len(text) > max_len:
            errors.append({"field": key, "message": f"{label} maksimal {max_len} karakter."})
            continue
        ftype = f.get("type", "text")
        if ftype == "select" and text not in (f.get("options") or []):
            errors.append({"field": key, "message": f"Pilihan {label} tidak valid."})
            continue
        if ftype == "number":
            try:
                float(text)
            except ValueError:
                errors.append({"field": key, "message": f"{label} harus berupa angka."})
                continue
        if ftype == "date":
            try:
                date.fromisoformat(text)
            except ValueError:
                errors.append({"field": key, "message": f"{label} harus berformat YYYY-MM-DD."})
                continue
        clean[key] = text
    return clean, errors
