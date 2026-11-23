from httpx import AsyncClient


async def login_as(client: AsyncClient, username: str, password: str = "demo1234") -> str:
    res = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    return body["data"]["csrf_token"]


async def test_health_and_login_flow(client: AsyncClient):
    h = await client.get("/api/v1/health")
    assert h.status_code == 200
    assert h.json()["status"] == "ok"

    csrf = await login_as(client, "camat_laeya")
    assert csrf

    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["data"]["user"]["username"] == "camat_laeya"
    assert me.json()["data"]["user"]["district_name"] == "Laeya"


async def test_master_kecamatan_and_desa_rbac(client: AsyncClient):
    await login_as(client, "superadmin")
    dist_res = await client.get("/api/v1/admin/master/kecamatan/read?limit=5")
    assert dist_res.status_code == 200
    assert dist_res.json()["total"] == 25

    desa_res = await client.get("/api/v1/admin/master/desa/read?limit=20")
    assert desa_res.status_code == 200
    assert desa_res.json()["total"] == 17

    # Operator desa hanya bisa melihat 1 desa miliknya sendiri
    await login_as(client, "op_torobulu")
    op_desa = await client.get("/api/v1/admin/master/desa/read")
    assert op_desa.status_code == 200
    assert op_desa.json()["total"] == 1
    assert op_desa.json()["data"][0]["name"] == "Torobulu"
