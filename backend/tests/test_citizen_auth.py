from httpx import AsyncClient

from app.core import rate_limit

BASE = "/api/v1/masyarakat/auth"
PAYLOAD = {
    "email": "Warga.Satu@Example.com",
    "password": "Rahasia123",
    "full_name": "Warga Satu",
    "phone": "0812-3456-7890",
}


async def register(client: AsyncClient, **over) -> dict:
    res = await client.post(f"{BASE}/register", json={**PAYLOAD, **over})
    return res


async def test_register_login_me_logout(client: AsyncClient):
    res = await register(client)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["citizen"]["email"] == "warga.satu@example.com"
    assert data["citizen"]["district_name"] == "Laeya"  # kecamatan default
    assert data["citizen"]["phone"] == "081234567890"
    assert "password" not in str(data)

    me = await client.get(f"{BASE}/me")
    assert me.status_code == 200
    csrf = me.json()["data"]["csrf_token"]
    assert csrf

    # logout butuh CSRF
    bad = await client.post(f"{BASE}/logout")
    assert bad.status_code == 403
    ok = await client.post(f"{BASE}/logout", headers={"X-CSRF-Token": client.cookies["citizen_csrf_token"]})
    assert ok.status_code == 200
    assert (await client.get(f"{BASE}/me")).status_code == 401

    login = await client.post(
        f"{BASE}/login", json={"email": "warga.satu@example.com", "password": "Rahasia123"}
    )
    assert login.status_code == 200
    assert (await client.get(f"{BASE}/me")).status_code == 200


async def test_register_validation_and_duplicate(client: AsyncClient):
    assert (await register(client, password="pendek1")).status_code == 422
    assert (await register(client, password="hanyahuruf")).status_code == 422
    assert (await register(client, phone="abc")).status_code == 422
    assert (await register(client, village_id="bukan-desa")).status_code == 422
    rate_limit.citizen_register_limiter._hits.clear()
    assert (await register(client)).status_code == 201
    dup = await register(client, email="warga.satu@example.com")
    assert dup.status_code == 409


async def test_register_is_rate_limited(client: AsyncClient):
    codes = [(await register(client, email=f"w{i}@example.com")).status_code for i in range(7)]
    assert codes[:5] == [201] * 5
    assert codes[5:] == [429, 429]


async def test_login_wrong_password_is_generic(client: AsyncClient):
    await register(client)
    client.cookies.clear()
    wrong = await client.post(f"{BASE}/login", json={"email": PAYLOAD["email"], "password": "Salah12345"})
    unknown = await client.post(f"{BASE}/login", json={"email": "tidak.ada@example.com", "password": "Salah12345"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["message"] == unknown.json()["message"]


async def test_nik_encrypted_masked_and_unique(client: AsyncClient, test_db):
    from sqlalchemy import select

    from app.models.citizen import Citizen

    await register(client)
    csrf = {"X-CSRF-Token": client.cookies["citizen_csrf_token"]}
    bad = await client.patch(f"{BASE}/profile", json={"nik": "123"}, headers=csrf)
    assert bad.status_code == 422

    res = await client.patch(f"{BASE}/profile", json={"nik": "7405123456780001"}, headers=csrf)
    assert res.status_code == 200
    assert res.json()["data"]["citizen"]["nik_masked"] == "7405********0001"
    assert "7405123456780001" not in res.text

    row = (await test_db.execute(select(Citizen))).scalars().one()
    assert row.nik_encrypted and "7405123456780001" not in row.nik_encrypted

    # akun kedua tidak boleh memakai NIK yang sama
    client.cookies.clear()
    await register(client, email="warga.dua@example.com")
    csrf2 = {"X-CSRF-Token": client.cookies["citizen_csrf_token"]}
    dup = await client.patch(f"{BASE}/profile", json={"nik": "7405123456780001"}, headers=csrf2)
    assert dup.status_code == 409


async def test_change_password_revokes_sessions(client: AsyncClient):
    await register(client)
    csrf = {"X-CSRF-Token": client.cookies["citizen_csrf_token"]}
    old_refresh = client.cookies["citizen_refresh_token"]

    wrong = await client.post(
        f"{BASE}/change-password",
        json={"current_password": "Salah12345", "new_password": "BaruRahasia9"},
        headers=csrf,
    )
    assert wrong.status_code == 401
    ok = await client.post(
        f"{BASE}/change-password",
        json={"current_password": "Rahasia123", "new_password": "BaruRahasia9"},
        headers=csrf,
    )
    assert ok.status_code == 200

    # refresh token lama sudah dicabut
    client.cookies.set("citizen_refresh_token", old_refresh, path=BASE)
    stale = await client.post(f"{BASE}/refresh")
    assert stale.status_code == 401

    client.cookies.clear()
    assert (
        await client.post(f"{BASE}/login", json={"email": PAYLOAD["email"], "password": "Rahasia123"})
    ).status_code == 401
    assert (
        await client.post(f"{BASE}/login", json={"email": PAYLOAD["email"], "password": "BaruRahasia9"})
    ).status_code == 200


async def test_citizen_and_staff_sessions_are_isolated(client: AsyncClient):
    # token warga tidak bisa dipakai di endpoint petugas, dan sebaliknya
    await register(client)
    assert (await client.get("/api/v1/auth/me")).status_code == 401
    assert (await client.get("/api/v1/admin/master/kecamatan/read")).status_code == 401

    client.cookies.clear()
    login = await client.post("/api/v1/auth/login", json={"username": "camat_laeya", "password": "demo1234"})
    assert login.status_code == 200
    assert (await client.get(f"{BASE}/me")).status_code == 401
