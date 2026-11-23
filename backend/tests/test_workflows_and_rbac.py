from httpx import AsyncClient

from app.db.seed_master import VILLAGE_PUUNGGALUKU_ID, VILLAGE_TOROBULU_ID


async def login_as(client: AsyncClient, username: str, password: str = "demo1234") -> str:
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["data"]["csrf_token"]


async def test_publish_endpoints_and_masked_tracking(client: AsyncClient):
    dist = await client.get("/api/v1/publish/districts")
    assert dist.status_code == 200
    assert len(dist.json()["data"]) == 25

    ov = await client.get("/api/v1/publish/districts/laeya/overview")
    assert ov.status_code == 200
    assert ov.json()["data"]["leader"]["full_name"] == "Ansar"
    assert ov.json()["data"]["logo_url"] == "/img/logo-konsel.webp"

    trk = await client.get("/api/v1/publish/services/track/SIP-740511-2026-0042")
    assert trk.status_code == 200
    body = trk.json()["data"]
    assert body["applicant_name_masked"] == "A*** S***"
    assert "applicant_nik" not in body

    # Uji kompatibilitas jika dicari dengan kode lama
    trk_old = await client.get("/api/v1/publish/services/track/PATEN-740511-2026-0042")
    assert trk_old.status_code == 200


async def test_quarterly_report_workflow_and_rbac_isolation(client: AsyncClient):
    csrf_op = await login_as(client, "op_torobulu")

    # Operator Torobulu tidak boleh membuat laporan untuk Kel. Puunggaluku
    forb = await client.post(
        "/api/v1/admin/pelaporan/triwulan/create",
        headers={"X-CSRF-Token": csrf_op},
        json={
            "village_id": VILLAGE_PUUNGGALUKU_ID,
            "report_type_id": "rt-lppd",
            "period_id": "per-2026-4",
            "title": "Percobaan Lintas Desa",
        },
    )
    assert forb.status_code == 403

    # Buat draf laporan untuk Desanya sendiri (Torobulu)
    created = await client.post(
        "/api/v1/admin/pelaporan/triwulan/create",
        headers={"X-CSRF-Token": csrf_op},
        json={
            "village_id": VILLAGE_TOROBULU_ID,
            "report_type_id": "rt-lppd",
            "period_id": "per-2026-4",
            "title": "LPPD TW IV 2026 Torobulu",
            "summary_payload": {"jumlah_kegiatan": 12},
        },
    )
    assert created.status_code == 201
    rep_id = created.json()["data"]["id"]
    assert created.json()["data"]["status"] == "draf"

    # Ajukan laporan
    sub = await client.post(
        f"/api/v1/admin/pelaporan/triwulan/{rep_id}/submit",
        headers={"X-CSRF-Token": csrf_op},
    )
    assert sub.status_code == 200
    assert sub.json()["data"]["status"] == "diajukan"

    # Terkunci saat status diajukan
    locked = await client.put(
        f"/api/v1/admin/pelaporan/triwulan/update/{rep_id}",
        headers={"X-CSRF-Token": csrf_op},
        json={
            "report_type_id": "rt-lppd",
            "period_id": "per-2026-4",
            "title": "Ubah Paksa",
        },
    )
    assert locked.status_code == 409

    # Camat mengembalikan untuk perbaikan tanpa catatan -> 422
    csrf_camat = await login_as(client, "camat_laeya")
    bad_verify = await client.post(
        f"/api/v1/admin/pelaporan/triwulan/{rep_id}/verify",
        headers={"X-CSRF-Token": csrf_camat},
        json={"decision": "perlu_perbaikan", "note": ""},
    )
    assert bad_verify.status_code == 422

    # Camat mengembalikan dengan catatan
    ret = await client.post(
        f"/api/v1/admin/pelaporan/triwulan/{rep_id}/verify",
        headers={"X-CSRF-Token": csrf_camat},
        json={"decision": "perlu_perbaikan", "note": "Lengkapi lampiran PDF"},
    )
    assert ret.status_code == 200
    assert ret.json()["data"]["status"] == "perlu_perbaikan"

    # Operator mengajukan ulang -> submission_version naik menjadi 2
    csrf_op = await login_as(client, "op_torobulu")
    resub = await client.post(
        f"/api/v1/admin/pelaporan/triwulan/{rep_id}/submit",
        headers={"X-CSRF-Token": csrf_op},
    )
    assert resub.status_code == 200
    assert resub.json()["data"]["submission_version"] == 2

    # Camat verifikasi final
    csrf_camat = await login_as(client, "camat_laeya")
    fin = await client.post(
        f"/api/v1/admin/pelaporan/triwulan/{rep_id}/verify",
        headers={"X-CSRF-Token": csrf_camat},
        json={"decision": "terverifikasi", "note": "Lengkap"},
    )
    assert fin.status_code == 200
    assert fin.json()["data"]["status"] == "terverifikasi"


async def test_monitoring_and_exports(client: AsyncClient):
    await login_as(client, "admin_laeya")
    summ = await client.get("/api/v1/admin/pemantauan/summary")
    assert summ.status_code == 200
    assert summ.json()["data"]["active_villages_count"] == 17

    xlsx = await client.get("/api/v1/admin/pemantauan/export/xlsx?report_scope=completeness")
    assert xlsx.status_code == 200
    assert "spreadsheetml" in xlsx.headers["content-type"]

    pdf = await client.get("/api/v1/admin/pemantauan/export/pdf?report_scope=completeness")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
