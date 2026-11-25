"""Aturan peran: Camat memegang semua menu, tetapi terbatas pada kecamatannya sendiri."""

from httpx import AsyncClient
from sqlalchemy import select
from test_citizen_services import staff_login

from app.models.master import MasterDistrict

ADM = "/api/v1/admin"


async def districts(test_db):
    rows = (await test_db.execute(select(MasterDistrict))).scalars().all()
    laeya = next(d for d in rows if d.slug == "laeya")
    other = next(d for d in rows if d.slug != "laeya")
    return laeya, other


def district_body(d, **over):
    body = {"code": d.code, "name": d.name, "slug": d.slug, "is_active": True, "is_default": d.is_default}
    return {**body, **over}


async def test_camat_can_use_every_menu(client: AsyncClient):
    h = await staff_login(client, "camat_laeya")
    for path in ("/sistem/pengguna/read", "/sistem/audit-log/read", "/sistem/pencadangan/read",
                 "/master/jabatan/read", "/master/jenis-layanan/read", "/pelayanan/permohonan/read",
                 "/pelayanan/layanan", "/penandatangan/status"):
        res = await client.get(f"{ADM}{path}")
        assert res.status_code == 200, f"{path} -> {res.status_code}"
    created = await client.post(
        f"{ADM}/master/jabatan/create", json={"code": "JBT-UJI", "name": "Jabatan Uji"}, headers=h
    )
    assert created.status_code == 201, created.text


async def test_camat_updates_only_own_district_and_keeps_regency_settings(client: AsyncClient, test_db):
    laeya, other = await districts(test_db)
    laeya_default, laeya_slug = laeya.is_default, laeya.slug
    h = await staff_login(client, "camat_laeya")

    denied = await client.put(f"{ADM}/master/kecamatan/update/{other.id}", json=district_body(other), headers=h)
    assert denied.status_code == 403

    ok = await client.put(
        f"{ADM}/master/kecamatan/update/{laeya.id}",
        json=district_body(laeya, office_address="Alamat Baru", slug="diubah", is_default=not laeya_default),
        headers=h,
    )
    assert ok.status_code == 200, ok.text
    data = ok.json()["data"]
    assert data["office_address"] == "Alamat Baru"
    assert data["slug"] == laeya_slug and data["is_default"] == laeya_default

    assert (await client.delete(f"{ADM}/master/kecamatan/delete/{other.id}", headers=h)).status_code == 403


async def test_camat_cannot_create_superadmin_or_reach_other_district(client: AsyncClient, test_db):
    _, other = await districts(test_db)
    h = await staff_login(client, "camat_laeya")
    base = {"full_name": "Uji", "password": "UjiSandi123"}

    sup = await client.post(f"{ADM}/sistem/pengguna/create", headers=h,
                            json={**base, "username": "u1", "email": "u1@x.id", "role": "superadmin_kab"})
    assert sup.status_code == 403
    far = await client.post(f"{ADM}/sistem/pengguna/create", headers=h,
                            json={**base, "username": "u2", "email": "u2@x.id", "role": "admin_kecamatan",
                                  "district_id": other.id})
    assert far.status_code == 403
    ok = await client.post(f"{ADM}/sistem/pengguna/create", headers=h,
                           json={**base, "username": "u3", "email": "u3@x.id", "role": "admin_kecamatan"})
    assert ok.status_code == 201, ok.text


async def test_admin_cannot_create_camat_account(client: AsyncClient):
    h = await staff_login(client, "admin_laeya")
    res = await client.post(f"{ADM}/sistem/pengguna/create", headers=h, json={
        "username": "camat_palsu", "full_name": "X", "email": "palsu@x.id", "password": "UjiSandi123",
        "role": "camat_sekcam"})
    assert res.status_code == 403
    assert (await client.get(f"{ADM}/sistem/pencadangan/read")).status_code == 403


async def test_village_cannot_be_moved_by_non_superadmin(client: AsyncClient, test_db):
    laeya, other = await districts(test_db)
    h = await staff_login(client, "camat_laeya")
    village = (await client.get(f"{ADM}/master/desa/read?limit=1")).json()["data"][0]
    body = {"code": village["code"], "name": village["name"], "slug": village["slug"],
            "type": village["type"], "district_id": other.id}
    res = await client.put(f"{ADM}/master/desa/update/{village['id']}", json=body, headers=h)
    assert res.status_code == 200, res.text
    assert res.json()["data"]["district_id"] == laeya.id
