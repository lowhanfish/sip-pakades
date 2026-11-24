from httpx import AsyncClient

CIT = "/api/v1/masyarakat"
ADM = "/api/v1/admin/pelayanan/layanan"
TYPE = "srv-nikah"  # kategori "rekomendasi", butuh surat desa

PDF = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


async def staff_login(client: AsyncClient, username: str) -> dict:
    client.cookies.clear()
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": "demo1234"})
    assert res.status_code == 200
    return {"X-CSRF-Token": res.json()["data"]["csrf_token"]}


async def activate_service(client: AsyncClient, type_id: str = TYPE) -> None:
    h = await staff_login(client, "admin_laeya")
    save = await client.put(
        f"{ADM}/{type_id}",
        json={
            "legal_basis": "Perbup Konawe Selatan No. X Tahun 2025",
            "legal_basis_reviewed_at": "2026-11-01",
            "not_village_function": True,
            "criteria_checks": {},
        },
        headers=h,
    )
    assert save.status_code == 200
    h = await staff_login(client, "camat_laeya")
    res = await client.post(f"{ADM}/{type_id}/activate", headers=h)
    assert res.status_code == 200, res.text


async def citizen(client: AsyncClient, email: str = "warga@example.com", nik: str | None = "7405123456780001"):
    client.cookies.clear()
    res = await client.post(
        f"{CIT}/auth/register",
        json={"email": email, "password": "Rahasia123", "full_name": "Warga Uji"},
    )
    assert res.status_code == 201, res.text
    h = {"X-CSRF-Token": client.cookies["citizen_csrf_token"]}
    if nik:
        assert (await client.patch(f"{CIT}/auth/profile", json={"nik": nik}, headers=h)).status_code == 200
    return h


async def first_village(test_db) -> str:
    from sqlalchemy import select

    from app.models.master import MasterVillage

    return (await test_db.execute(select(MasterVillage.id).limit(1))).scalar_one()


async def test_nothing_is_offered_until_camat_activates(client: AsyncClient):
    h = await citizen(client)
    assert (await client.get(f"{CIT}/layanan")).json()["data"] == []
    pub = await client.get("/api/v1/publish/services/types")
    assert pub.json()["data"] == []
    res = await client.post(f"{CIT}/permohonan", json={"service_type_id": TYPE, "data": {"keperluan": "x"}}, headers=h)
    assert res.status_code == 404


async def test_activation_rules_and_roles(client: AsyncClient):
    h = await staff_login(client, "admin_laeya")
    # Belum lengkap: aktivasi ditolak dan alasannya terdaftar
    res = await client.post(f"{ADM}/{TYPE}/activate", headers=h)
    assert res.status_code == 403  # Admin Kecamatan tidak boleh mengaktifkan

    h = await staff_login(client, "camat_laeya")
    res = await client.post(f"{ADM}/{TYPE}/activate", headers=h)
    assert res.status_code == 422
    msgs = " ".join(e["message"] for e in res.json()["errors"])
    assert "Dasar hukum" in msgs and "fungsi desa" in msgs

    # Perizinan wajib memenuhi 4 kriteria Pasal 11
    res = await client.put(
        f"{ADM}/srv-iumk",
        json={
            "legal_basis": "X", "legal_basis_reviewed_at": "2026-11-01",
            "not_village_function": True, "criteria_checks": {"proses_sederhana": True},
        },
        headers=h,
    )
    assert res.status_code == 200
    res = await client.post(f"{ADM}/srv-iumk/activate", headers=h)
    assert res.status_code == 422
    assert "Kriteria belum terpenuhi" in " ".join(e["message"] for e in res.json()["errors"])

    # Kriteria yang bukan milik kategori ditolak
    bad = await client.put(f"{ADM}/{TYPE}", json={"criteria_checks": {"ngawur": True}}, headers=h)
    assert bad.status_code == 422


async def test_editing_active_service_forces_review(client: AsyncClient):
    await activate_service(client)
    h = await staff_login(client, "admin_laeya")
    res = await client.put(f"{ADM}/{TYPE}", json={"legal_basis": "Dasar baru"}, headers=h)
    assert res.json()["data"]["is_active"] is False


async def test_full_citizen_flow(client: AsyncClient, test_db):
    await activate_service(client)
    h = await citizen(client)
    vid = await first_village(test_db)

    cat = (await client.get(f"{CIT}/layanan")).json()["data"]
    assert [c["id"] for c in cat] == [TYPE]
    assert cat[0]["form_fields"][0]["key"] == "keperluan"

    res = await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "village_cover_letter_no": "470/12/2026",
              "data": {"keperluan": "Menikah", "tidak_dikenal": "dibuang"}},
        headers=h,
    )
    assert res.status_code == 201, res.text
    d = res.json()["data"]
    rid = d["id"]
    assert d["status"] == "draf" and d["registration_number"] is None
    assert d["applicant_nik_masked"] == "7405********0001"
    assert d["data"] == {"keperluan": "Menikah"}

    # Belum lengkap: berkas wajib belum ada
    res = await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h)
    assert res.status_code == 422
    assert any("pengantar_desa" == e["field"] for e in res.json()["errors"])

    for code, content, name in (("pengantar_desa", PDF, "surat.pdf"), ("ktp_kk", PNG, "ktp.png")):
        up = await client.post(
            f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": code},
            files={"file": (name, content, "application/octet-stream")}, headers=h,
        )
        assert up.status_code == 200, up.text

    # Draf belum terlihat petugas
    await staff_login(client, "admin_laeya")
    lst = await client.get("/api/v1/admin/pelayanan/permohonan/read?limit=100")
    assert all(r["id"] != rid for r in lst.json()["data"])

    # Kembali sebagai warga yang sama
    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    h = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}

    res = await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h)
    assert res.status_code == 200, res.text
    d = res.json()["data"]
    assert d["status"] == "diterima"
    assert d["registration_number"].startswith("SIP-")
    assert d["timeline"][-1]["public_note"]
    assert "changed_by_name" not in str(d["timeline"])

    # Setelah dikirim: tidak bisa diubah
    assert (await client.delete(f"{CIT}/permohonan/{rid}", headers=h)).status_code == 409
    up = await client.post(
        f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": "ktp_kk"},
        files={"file": ("a.png", PNG, "image/png")}, headers=h,
    )
    assert up.status_code == 409

    # Petugas kini melihatnya, dengan NIK tersamar
    await staff_login(client, "admin_laeya")
    lst = await client.get("/api/v1/admin/pelayanan/permohonan/read?limit=100")
    row = next(r for r in lst.json()["data"] if r["id"] == rid)
    assert row["applicant_nik_masked"] == "740512******0001"
    assert "7405123456780001" not in lst.text

    # Pelacakan publik
    trk = await client.get(f"/api/v1/publish/services/track/{d['registration_number']}")
    assert trk.status_code == 200


async def test_upload_security(client: AsyncClient, test_db):
    await activate_service(client)
    h = await citizen(client)
    vid = await first_village(test_db)
    rid = (await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "data": {"keperluan": "x"}}, headers=h,
    )).json()["data"]["id"]

    async def up(code, name, content, ctype="application/pdf"):
        return await client.post(
            f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": code},
            files={"file": (name, content, ctype)}, headers=h,
        )

    # Ekstensi/Content-Type palsu: isi bukan PDF
    assert (await up("ktp_kk", "x.pdf", b"<script>alert(1)</script>")).status_code == 422
    assert (await up("ktp_kk", "x.pdf", b"")).status_code == 422
    # Jenis berkas yang tidak ada di layanan
    assert (await up("sembarang", "x.pdf", PDF)).status_code == 422
    # Terlalu besar
    assert (await up("ktp_kk", "x.pdf", PDF + b"0" * (10 * 1024 * 1024))).status_code == 422
    # Nama berkas berbahaya tidak memengaruhi lokasi simpan
    ok = await up("ktp_kk", "../../etc/passwd.pdf", PDF)
    assert ok.status_code == 200
    doc = ok.json()["data"]["documents"][0]
    assert doc["file_name"] == "passwd.pdf"
    # Unggah ulang jenis yang sama menggantikan, bukan menambah
    ok2 = await up("ktp_kk", "baru.pdf", PDF)
    assert len(ok2.json()["data"]["documents"]) == 1

    dl = await client.get(f"{CIT}/permohonan/{rid}/dokumen/{ok2.json()['data']['documents'][0]['id']}/unduh")
    assert dl.status_code == 200 and dl.content == PDF
    assert dl.headers["x-content-type-options"] == "nosniff"


async def test_citizens_cannot_see_each_other(client: AsyncClient, test_db):
    await activate_service(client)
    h1 = await citizen(client, "satu@example.com", nik="7405123456780001")
    vid = await first_village(test_db)
    rid = (await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "data": {"keperluan": "x"}}, headers=h1,
    )).json()["data"]["id"]
    doc = (await client.post(
        f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": "ktp_kk"},
        files={"file": ("a.pdf", PDF, "application/pdf")}, headers=h1,
    )).json()["data"]["documents"][0]["id"]

    h2 = await citizen(client, "dua@example.com", nik="7405123456780002")
    assert (await client.get(f"{CIT}/permohonan/{rid}")).status_code == 404
    assert (await client.get(f"{CIT}/permohonan/{rid}/dokumen/{doc}/unduh")).status_code == 404
    assert (await client.delete(f"{CIT}/permohonan/{rid}", headers=h2)).status_code == 404
    assert (await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h2)).status_code == 404
    assert (await client.get(f"{CIT}/permohonan")).json()["total"] == 0


async def test_nik_required_and_csrf(client: AsyncClient, test_db):
    await activate_service(client)
    h = await citizen(client, nik=None)
    vid = await first_village(test_db)
    body = {"service_type_id": TYPE, "village_id": vid, "data": {"keperluan": "x"}}
    assert (await client.post(f"{CIT}/permohonan", json=body)).status_code == 403  # tanpa CSRF
    res = await client.post(f"{CIT}/permohonan", json=body, headers=h)
    assert res.status_code == 422  # NIK belum ada di profil
    res = await client.post(f"{CIT}/permohonan", json={**body, "applicant_nik": "7405123456780009"}, headers=h)
    assert res.status_code == 201
    # Isian wajib form dinamis
    res = await client.post(
        f"{CIT}/permohonan", json={**body, "data": {}, "applicant_nik": "7405123456780009"}, headers=h
    )
    assert res.status_code == 422


async def test_deactivated_service_blocks_submission(client: AsyncClient, test_db):
    await activate_service(client)
    h = await citizen(client)
    vid = await first_village(test_db)
    rid = (await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "village_cover_letter_no": "1",
              "data": {"keperluan": "x"}}, headers=h,
    )).json()["data"]["id"]
    for code in ("pengantar_desa", "ktp_kk"):
        await client.post(
            f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": code},
            files={"file": ("a.pdf", PDF, "application/pdf")}, headers=h,
        )
    sh = await staff_login(client, "admin_laeya")
    assert (await client.post(f"{ADM}/{TYPE}/deactivate", headers=sh)).status_code == 200
    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    h = {"X-CSRF-Token": login.json()["data"]["csrf_token"]}
    assert (await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h)).status_code == 404
