import json
import re

import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from test_citizen_services import (
    CIT,
    PDF,
    TYPE,
    activate_service,
    citizen,
    first_village,
    staff_login,
)
from test_service_verification import ADM, set_status

from app.core.config import get_settings
from app.models.operational import ServiceRequest, SigningTransaction
from app.services import tte_client
from app.services.letter_pdf import clean_text
from app.services.tte_client import LiveTTEClient

SIGN = "/api/v1/admin/penandatangan"
NIK = "7405123456780099"
GOOD = "passphrase-uji-lokal"


@pytest.fixture(autouse=True)
def _mock_tte(monkeypatch):
    monkeypatch.setattr(get_settings(), "TTE_MODE", "mock")
    tte_client.reset_mock()
    yield
    tte_client.reset_mock()


async def make_request(client: AsyncClient, test_db, email: str, nik: str) -> str:
    """Satu permohonan warga yang sudah diverifikasi admin dan menunggu tanda tangan."""
    h = await citizen(client, email, nik=nik)
    vid = await first_village(test_db)
    rid = (await client.post(
        f"{CIT}/permohonan",
        json={"service_type_id": TYPE, "village_id": vid, "village_cover_letter_no": "470/1/2026",
              "data": {"keperluan": "Menikah"}}, headers=h,
    )).json()["data"]["id"]
    for code in ("pengantar_desa", "ktp_kk"):
        await client.post(
            f"{CIT}/permohonan/{rid}/dokumen", data={"doc_code": code},
            files={"file": ("a.pdf", PDF, "application/pdf")}, headers=h,
        )
    assert (await client.post(f"{CIT}/permohonan/{rid}/kirim", headers=h)).status_code == 200
    ah = await staff_login(client, "admin_laeya")
    assert (await set_status(client, ah, rid, "menunggu_ttd", documents_verified=True)).status_code == 200
    return rid


async def camat(client: AsyncClient, with_nik: bool = True) -> dict:
    h = await staff_login(client, "camat_laeya")
    if with_nik:
        assert (await client.put(f"{SIGN}/nik", json={"nik": NIK}, headers=h)).status_code == 200
    return h


async def sign(client: AsyncClient, h: dict, ids: list[str], passphrase: str = GOOD):
    return await client.post(f"{SIGN}/tandatangani", json={"request_ids": ids, "passphrase": passphrase}, headers=h)


# ------------------------------------------------------------------ NIK penandatangan

async def test_signer_nik_only_camat_encrypted_and_masked(client: AsyncClient, test_db):
    ah = await staff_login(client, "admin_laeya")
    assert (await client.put(f"{SIGN}/nik", json={"nik": NIK}, headers=ah)).status_code == 403
    assert (await client.get(f"{SIGN}/status")).status_code == 403

    h = await staff_login(client, "camat_laeya")
    assert (await client.put(f"{SIGN}/nik", json={"nik": "123"}, headers=h)).status_code == 422
    res = await client.put(f"{SIGN}/nik", json={"nik": NIK}, headers=h)
    assert res.status_code == 200 and res.json()["data"]["nik_masked"] == "7405********0099"
    assert NIK not in res.text

    st = (await client.get(f"{SIGN}/status")).json()["data"]
    assert st["signer"]["has_nik"] is True and st["signer"]["nik_masked"] == "7405********0099"
    assert NIK not in json.dumps(st)

    from app.models.auth import User
    row = (await test_db.execute(select(User).where(User.username == "camat_laeya"))).scalar_one()
    assert row.signer_nik_encrypted and NIK not in row.signer_nik_encrypted

    assert (await client.delete(f"{SIGN}/nik", headers=h)).status_code == 200
    assert (await client.get(f"{SIGN}/status")).json()["data"]["signer"]["has_nik"] is False


# ------------------------------------------------------------------ prasyarat

async def test_signing_is_off_by_default(client: AsyncClient, test_db, monkeypatch):
    rid = await _ready(client, test_db)
    monkeypatch.setattr(get_settings(), "TTE_MODE", "disabled")
    h = await camat(client)
    res = await sign(client, h, [rid])
    assert res.status_code == 503


async def _ready(client, test_db) -> str:
    await activate_service(client)
    return await make_request(client, test_db, "warga@example.com", "7405123456780001")


async def test_sign_needs_nik_and_camat_role(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client, with_nik=False)
    assert (await sign(client, h, [rid])).status_code == 422  # NIK belum diisi

    ah = await staff_login(client, "admin_laeya")
    assert (await sign(client, ah, [rid])).status_code == 403  # Admin Kecamatan tidak boleh menandatangani


# ------------------------------------------------------------------ alur berhasil

async def test_sign_success_end_to_end(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client)

    prev = await client.get(f"{SIGN}/{rid}/pratinjau")
    assert prev.status_code == 200 and prev.content.startswith(b"%PDF")

    res = await sign(client, h, [rid])
    assert res.status_code == 200, res.text
    item = res.json()["data"][0]
    assert item["status"] == "succeeded"
    assert re.fullmatch(r"400/\d{3}/KEC-LAEYA/[IVX]+/\d{4}", item["letter_number"])
    assert GOOD not in res.text

    # Status selesai, tercatat di riwayat dengan catatan publik
    adm = (await client.get(f"{ADM}/read?limit=50")).json()["data"]
    row = next(r for r in adm if r["id"] == rid)
    assert row["status"] == "selesai" and row["has_signed_letter"] and row["letter_number"] == item["letter_number"]
    assert row["histories"][-1]["public_note"].startswith("Surat telah selesai")

    # Admin Kecamatan bisa mengunduh surat bertanda tangan
    await staff_login(client, "admin_laeya")
    dl = await client.get(f"{SIGN}/{rid}/surat")
    assert dl.status_code == 200 and dl.content.startswith(b"%PDF")
    assert dl.content.endswith(tte_client.MockTTEClient.SIGNED_MARK)

    # Warga mengunduh suratnya sendiri
    client.cookies.clear()
    login = await client.post(f"{CIT}/auth/login", json={"email": "warga@example.com", "password": "Rahasia123"})
    assert login.status_code == 200
    detail = (await client.get(f"{CIT}/permohonan/{rid}")).json()["data"]
    assert detail["status"] == "selesai" and detail["has_signed_letter"] and detail["letter_number"]
    mine = await client.get(f"{CIT}/permohonan/{rid}/surat")
    assert mine.status_code == 200 and mine.headers["x-content-type-options"] == "nosniff"

    # Pemeriksaan keaslian publik lewat kode QR
    sr = (await test_db.execute(select(ServiceRequest).where(ServiceRequest.id == rid))).scalar_one()
    client.cookies.clear()
    ok = await client.get(f"/api/v1/publish/verifikasi/{sr.verification_code}")
    assert ok.status_code == 200 and ok.json()["data"]["valid"] is True
    assert ok.json()["data"]["letter_number"] == item["letter_number"]
    assert "Warga Uji" not in ok.text  # nama pemohon disamarkan
    assert (await client.get("/api/v1/publish/verifikasi/KODESALAH123")).status_code == 404


async def test_passphrase_is_never_persisted(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client)
    secret = "RAHASIA-PASSPHRASE-12345"
    assert (await sign(client, h, [rid], secret)).status_code == 200

    from app.models.audit import AuditLog
    from app.models.operational import ServiceStatusHistory
    parts = []
    for model in (SigningTransaction, AuditLog, ServiceStatusHistory, ServiceRequest):
        for o in (await test_db.execute(select(model))).scalars().all():
            parts.append(str(vars(o)))
    blob = " ".join(parts)
    assert secret not in blob
    # NIK penandatangan dikirim ke gateway, tetapi passphrase tidak ikut tercatat di panggilan simulasi
    assert all(secret not in str(c) for c in tte_client._mock_singleton.calls)


# ------------------------------------------------------------------ keselamatan

async def test_wrong_passphrase_halts_batch_then_retry_works(client: AsyncClient, test_db):
    await activate_service(client)
    r1 = await make_request(client, test_db, "satu@example.com", "7405123456780001")
    r2 = await make_request(client, test_db, "dua@example.com", "7405123456780002")
    h = await camat(client)

    res = await sign(client, h, [r1, r2], "salah-passphrase")
    results = res.json()["data"]
    assert [r["status"] for r in results] == ["failed", "skipped"]
    assert results[0]["code"] == "signer_passphrase_invalid"
    assert len(tte_client._mock_singleton.calls) == 1  # surat kedua tidak dikirim: akun TTE tidak terkunci

    rows = (await test_db.execute(select(ServiceRequest).where(ServiceRequest.id.in_([r1, r2])))).scalars().all()
    assert {r.status for r in rows} == {"menunggu_ttd"}

    ok = await sign(client, h, [r1, r2])
    assert [r["status"] for r in ok.json()["data"]] == ["succeeded", "succeeded"]
    numbers = [r["letter_number"] for r in ok.json()["data"]]
    assert len(set(numbers)) == 2


async def test_unknown_result_is_not_retried_and_can_be_checked(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client)

    first = (await sign(client, h, [rid], "timeout")).json()["data"][0]
    assert first["status"] == "unknown"
    tx_id = first["transaction_id"]

    # Dicoba lagi: ditolak, bukan ditandatangani ulang
    again = (await sign(client, h, [rid])).json()["data"][0]
    assert again["status"] == "skipped" and "belum pasti" in again["message"]
    assert len(tte_client._mock_singleton.calls) == 1

    chk = await client.post(f"{SIGN}/transaksi/{tx_id}/periksa", headers=h)
    assert chk.status_code == 200 and chk.json()["data"]["status"] == "succeeded"
    row = (await test_db.execute(select(ServiceRequest).where(ServiceRequest.id == rid))).scalar_one()
    assert row.status == "selesai"


async def test_completed_request_cannot_be_signed_twice(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client)
    assert (await sign(client, h, [rid])).json()["data"][0]["status"] == "succeeded"
    second = (await sign(client, h, [rid])).json()["data"][0]
    assert second["status"] == "skipped"
    assert len(tte_client._mock_singleton.calls) == 1


async def test_queue_lists_waiting_requests_only(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    await camat(client)
    q = (await client.get(f"{SIGN}/antrean")).json()["data"]
    assert [i["id"] for i in q] == [rid]
    assert not any("nik" in key for key in q[0])  # antrean tidak memuat NIK pemohon


# ------------------------------------------------------------------ klien gateway sungguhan

def _live(handler) -> LiveTTEClient:
    s = get_settings()
    s.TTE_BASE_URL = "https://gateway.test"
    s.TTE_CLIENT_ID = "konsel_x"
    s.TTE_CLIENT_SECRET = "sign_y"
    return LiveTTEClient(transport=httpx.MockTransport(handler))


async def test_live_client_follows_gateway_contract(monkeypatch):
    s = get_settings()
    for k, v in (("TTE_BASE_URL", ""), ("TTE_CLIENT_ID", ""), ("TTE_CLIENT_SECRET", "")):
        monkeypatch.setattr(s, k, v)
    seen: dict = {"token": 0, "sign": []}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/oauth/token":
            seen["token"] += 1
            assert request.headers["authorization"].startswith("Basic ")
            assert b"grant_type=client_credentials" in request.content
            return httpx.Response(200, json={"access_token": "tte_abc", "expires_in": 900})
        assert request.url.path == "/api/v1/signkonsel"
        assert request.headers["authorization"] == "Bearer tte_abc"
        assert 8 <= len(request.headers["idempotency-key"]) <= 128
        names = set(re.findall(rb'(?<![a-z])name="([^"]+)"', request.content))
        seen["sign"].append(names)
        return httpx.Response(200, content=b"%PDF-signed", headers={
            "content-type": "application/pdf", "X-Signing-Request-ID": "req-1"})

    client = _live(handler)
    for i in range(2):
        res = await client.sign(pdf=b"%PDF-x", nik=NIK, passphrase=GOOD, tag="€", idempotency_key=f"key-{i}-12345678")
        assert res.outcome == "succeeded" and res.pdf == b"%PDF-signed" and res.request_id == "req-1"
    assert seen["token"] == 1  # token di-cache
    # persis empat field yang diizinkan gateway
    assert all(n == {b"file", b"nik", b"passphrase", b"tag_koordinat"} for n in seen["sign"])


@pytest.mark.parametrize(
    ("status", "body", "outcome", "retry"),
    [
        (422, {"message": "x", "code": "signer_passphrase_invalid", "retry_signing": False, "request_id": "r"}, "failed", False),
        (422, {"message": "NIK harus terdiri dari 16 digit angka."}, "failed", None),
        (504, {"message": "timeout"}, "unknown", False),
        (503, {"message": "gangguan", "request_id": "r2"}, "unknown", False),
    ],
)
async def test_live_client_maps_errors(status, body, outcome, retry):
    def handler(request):
        if request.url.path == "/oauth/token":
            return httpx.Response(200, json={"access_token": "t", "expires_in": 900})
        return httpx.Response(status, json=body)

    res = await _live(handler).sign(pdf=b"%PDF-x", nik=NIK, passphrase=GOOD, tag="€", idempotency_key="key-12345678")
    assert res.outcome == outcome and res.retry_signing is retry and res.pdf is None
    assert GOOD not in res.message


async def test_live_client_network_error_is_unknown_not_failed():
    def handler(request):
        if request.url.path == "/oauth/token":
            return httpx.Response(200, json={"access_token": "t", "expires_in": 900})
        raise httpx.ReadTimeout("lambat")

    res = await _live(handler).sign(pdf=b"%PDF-x", nik=NIK, passphrase=GOOD, tag="€", idempotency_key="key-12345678")
    assert res.outcome == "unknown" and res.retry_signing is False


async def test_live_client_bad_credentials_is_fatal():
    def handler(request):
        return httpx.Response(401, json={"message": "unauthorized"})

    res = await _live(handler).sign(pdf=b"%PDF-x", nik=NIK, passphrase=GOOD, tag="€", idempotency_key="key-12345678")
    assert res.outcome == "failed" and res.code == "gateway_credentials"


def test_mock_is_refused_in_production(monkeypatch):
    s = get_settings()
    monkeypatch.setattr(s, "TTE_MODE", "mock")
    monkeypatch.setattr(s, "APP_ENV", "production")
    with pytest.raises(tte_client.TTEConfigError):
        tte_client.get_tte_client()


def test_user_text_cannot_inject_signature_marker():
    assert "€" not in clean_text("Keperluan € palsu \x00 ok")


async def test_database_blocks_concurrent_signing_of_same_letter(client: AsyncClient, test_db):
    """Dua permintaan serentak lolos pemeriksaan status, tetapi kolom unik menolak yang kedua."""
    rid = await _ready(client, test_db)
    h = await camat(client)
    # Meniru permintaan lain yang baru saja mengunci surat ini (status sengaja tidak 'sending'
    # agar pemeriksaan di aplikasi lolos dan yang diuji murni batasan database).
    test_db.add(SigningTransaction(
        service_request_id=rid, requested_by="x", status="failed",
        idempotency_key="sipk-pesaing-1", active_slot=rid,
    ))
    await test_db.commit()

    res = (await sign(client, h, [rid])).json()["data"][0]
    assert res["status"] == "skipped" and "sedang berjalan" in res["message"]
    assert tte_client._mock_singleton.calls == []  # gateway tidak pernah dipanggil


async def test_slot_released_after_final_result(client: AsyncClient, test_db):
    rid = await _ready(client, test_db)
    h = await camat(client)
    assert (await sign(client, h, [rid], "salah-passphrase")).json()["data"][0]["status"] == "failed"
    txs = (await test_db.execute(select(SigningTransaction))).scalars().all()
    assert all(t.active_slot is None for t in txs)  # gagal = final, surat boleh dicoba lagi
    assert (await sign(client, h, [rid])).json()["data"][0]["status"] == "succeeded"


async def test_service_without_classification_fails_cleanly(client: AsyncClient, test_db):
    from app.models.master import MasterServiceType

    rid = await _ready(client, test_db)
    srv = (await test_db.execute(select(MasterServiceType).where(MasterServiceType.id == TYPE))).scalar_one()
    srv.letter_classification_id = None
    await test_db.commit()

    h = await camat(client)
    res = await sign(client, h, [rid])
    assert res.status_code == 200  # pencatatan audit setelah rollback tidak boleh error
    item = res.json()["data"][0]
    assert item["status"] == "failed" and "klasifikasi" in item["message"]
    assert item["registration_number"]
    assert tte_client._mock_singleton.calls == []  # tidak ada yang dikirim ke gateway
