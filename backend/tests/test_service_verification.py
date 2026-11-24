import pytest
from httpx import AsyncClient
from test_citizen_services import (
    CIT,
    PDF,
    TYPE,
    activate_service,
    citizen,
    first_village,
    staff_login,
)

ADM = "/api/v1/admin/pelayanan/permohonan"


async def submitted_request(client: AsyncClient, test_db) -> tuple[str, str]:
    """Warga mengirim satu permohonan lengkap. Mengembalikan (id, nomor registrasi)."""
    await activate_service(client)
    h = await citizen(client)
    vid = await first_village(test_db)
    rid = (await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "village_cover_letter_no": "470/1/2026",
              "data": {"keperluan": "Menikah"}}, headers=h,
    )).json()["data"]["id"]
    for code in ("pengantar_desa", "ktp_kk"):
        up = await client.post(
            f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": code},
            files={"file": ("a.pdf", PDF, "application/pdf")}, headers=h,
        )
        assert up.status_code == 200
    sent = await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h)
    assert sent.status_code == 200
    return rid, sent.json()["data"]["registration_number"]


async def set_status(client: AsyncClient, headers: dict, rid: str, status: str, **extra):
    return await client.patch(f"{ADM}/{rid}/status", json={"status": status, **extra}, headers=headers)


@pytest.fixture
async def req(client: AsyncClient, test_db):
    return await submitted_request(client, test_db)


async def test_verification_then_signature_roles(client: AsyncClient, req):
    rid, _ = req
    h = await staff_login(client, "admin_laeya")

    # Tidak boleh melompat langsung ke selesai
    assert (await set_status(client, h, rid, "selesai")).status_code == 409
    # Meneruskan ke Camat wajib dengan pernyataan sudah memeriksa berkas
    assert (await set_status(client, h, rid, "menunggu_ttd")).status_code == 422
    ok = await set_status(client, h, rid, "menunggu_ttd", documents_verified=True)
    assert ok.status_code == 200
    data = ok.json()["data"]
    assert data["status"] == "menunggu_ttd" and data["verified_at"]
    assert data["next_statuses"] == ["perlu_kelengkapan", "ditolak"]

    # "selesai" tidak bisa diset manual oleh siapa pun, termasuk Camat: hanya lewat penandatanganan TTE
    assert (await set_status(client, h, rid, "selesai")).status_code == 409
    h = await staff_login(client, "camat_laeya")
    assert (await set_status(client, h, rid, "selesai")).status_code == 409


async def test_staff_without_review_role_is_refused(client: AsyncClient, req):
    rid, _ = req
    h = await staff_login(client, "op_torobulu")
    assert (await set_status(client, h, rid, "diproses")).status_code == 403


async def test_request_fix_then_citizen_resubmits(client: AsyncClient, req):
    rid, reg = req
    h = await staff_login(client, "admin_laeya")
    # Catatan kekurangan wajib
    assert (await set_status(client, h, rid, "perlu_kelengkapan")).status_code == 422
    res = await set_status(client, h, rid, "perlu_kelengkapan", note="Foto KTP buram, mohon unggah ulang.")
    assert res.status_code == 200

    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    ch = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    detail = (await client.get(f"{CIT}/permohonan/{rid}")).json()["data"]
    assert detail["status"] == "perlu_kelengkapan"
    assert detail["timeline"][-1]["public_note"] == "Foto KTP buram, mohon unggah ulang."

    # Warga bisa mengganti berkas, tetapi tidak boleh menghapus draf yang sudah terkirim
    up = await client.post(
        f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": "ktp_kk"},
        files={"file": ("baru.pdf", PDF, "application/pdf")}, headers=ch,
    )
    assert up.status_code == 200
    assert (await client.delete(f"{CIT}/permohonan/{rid}", headers=ch)).status_code == 409

    again = await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=ch)
    assert again.status_code == 200
    d = again.json()["data"]
    assert d["status"] == "diterima" and d["registration_number"] == reg  # nomor tidak berganti
    assert "Perbaikan" in again.json()["message"]


async def test_citizen_cannot_edit_while_being_processed(client: AsyncClient, req):
    rid, _ = req
    h = await staff_login(client, "admin_laeya")
    assert (await set_status(client, h, rid, "menunggu_ttd", documents_verified=True)).status_code == 200

    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    ch = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    up = await client.post(
        f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": "ktp_kk"},
        files={"file": ("x.pdf", PDF, "application/pdf")}, headers=ch,
    )
    assert up.status_code == 409
    assert (await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=ch)).status_code == 409


async def test_rejection_needs_reason_and_is_final(client: AsyncClient, req):
    rid, _ = req
    h = await staff_login(client, "admin_laeya")
    assert (await set_status(client, h, rid, "ditolak")).status_code == 422
    res = await set_status(client, h, rid, "ditolak", note="Dokumen tidak sesuai ketentuan.")
    assert res.status_code == 200
    assert (await set_status(client, h, rid, "diproses")).status_code == 409

    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    ch = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    detail = (await client.get(f"{CIT}/permohonan/{rid}")).json()["data"]
    assert detail["status"] == "ditolak"
    assert detail["timeline"][-1]["public_note"] == "Dokumen tidak sesuai ketentuan."
    assert (await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=ch)).status_code == 409


async def test_citizen_can_correct_data_only_when_editable(client: AsyncClient, req):
    rid, _ = req
    # Setelah dikirim (diterima) isian terkunci
    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    ch = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    locked = await client.patch(f"{CIT}/permohonan/{rid}", json={"village_cover_letter_no": "470/9/2026"}, headers=ch)
    assert locked.status_code == 409

    h = await staff_login(client, "admin_laeya")
    assert (await set_status(client, h, rid, "perlu_kelengkapan", note="Nomor surat desa keliru.")).status_code == 200

    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    ch = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    detail = (await client.get(f"{CIT}/permohonan/{rid}")).json()["data"]
    assert detail["requires_village_letter"] is True and detail["form_fields"][0]["key"] == "keperluan"

    # Validasi: nomor surat desa wajib, isian wajib tidak boleh kosong
    assert (await client.patch(f"{CIT}/permohonan/{rid}", json={"village_cover_letter_no": " "}, headers=ch)).status_code == 422
    assert (await client.patch(f"{CIT}/permohonan/{rid}", json={"data": {}}, headers=ch)).status_code == 422

    ok = await client.patch(
        f"{CIT}/permohonan/{rid}",
        json={"village_cover_letter_no": "470/9/2026", "data": {"keperluan": "Menikah (diperbaiki)", "liar": "x"},
              "applicant_address": "Dusun I"},
        headers=ch,
    )
    assert ok.status_code == 200
    d = ok.json()["data"]
    assert d["village_cover_letter_no"] == "470/9/2026" and d["data"] == {"keperluan": "Menikah (diperbaiki)"}
    assert d["applicant_address"] == "Dusun I"

    # Warga lain tidak bisa mengubahnya
    other = await citizen(client, "lain@example.com", nik="7405123456780077")
    assert (await client.patch(f"{CIT}/permohonan/{rid}", json={"applicant_address": "x"}, headers=other)).status_code == 404
