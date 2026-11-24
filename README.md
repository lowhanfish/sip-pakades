# SIP-PAKADES — Kabupaten Konawe Selatan (Pilot: Kecamatan Laeya)

**Sistem Informasi Pemerintahan & Pelayanan Administrasi Kecamatan dan Desa (SIP-PAKADES)** dengan arsitektur **multi-kecamatan** (25 kecamatan di Kabupaten Konawe Selatan, dengan Kecamatan Laeya dan 17 desa/kelurahannya sebagai kecamatan *pilot/default*).

- **Perencanaan Sistem:** [planning.md](planning.md)
- **Kontrak API (SSOT):** [API_CONTRACT.md](API_CONTRACT.md)

---

## Tech Stack
- **Frontend (`frontend/`):** Next.js 15 (App Router), TypeScript strict, TanStack Query v5, Zustand v5, Tailwind CSS v4, Framer Motion, Three.js / React Three Fiber (WebGL 3D), Leaflet + OpenStreetMap, SweetAlert2.
- **Backend (`backend/`):** Python 3.12+, FastAPI, SQLAlchemy 2.x Async (`asyncmy`), Alembic, MySQL 8.x / MariaDB (`sippakades`), Argon2id, PyJWT, HttpOnly Cookies + CSRF, `Pillow` (auto-WebP), `openpyxl`, `reportlab`.

---

## 1. Persiapan Database MySQL Lokal

```sql
CREATE DATABASE IF NOT EXISTS sippakades
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Salin konfigurasi environment backend:
```bash
cd backend
cp .env.example .env
# Sesuaikan DB_USER, DB_PASSWORD, DB_NAME=sippakades, dan JWT_SECRET_KEY di backend/.env
```

---

## 2. Menjalankan Backend FastAPI

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Jalankan migrasi & seeder awal (25 kecamatan, 17 desa Laeya, master & 6 akun uji)
alembic upgrade head
python scripts/seed_initial.py

# Jalankan server API
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- Health Check: `http://127.0.0.1:8000/api/v1/health`
- Swagger OpenAPI: `http://127.0.0.1:8000/docs`

### Konfigurasi Tambahan (`backend/.env`)
| Variabel | Fungsi |
| :--- | :--- |
| `DATA_ENCRYPTION_KEY` | Kunci Fernet untuk mengenkripsi NIK. **Wajib di production.** Buat: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `TTE_MODE` | `disabled` (bawaan) \| `mock` (simulasi, hanya development) \| `live` (gateway Esign Konsel) |
| `TTE_BASE_URL`, `TTE_CLIENT_ID`, `TTE_CLIENT_SECRET` | Kredensial aplikasi dari admin gateway. **Isi hanya di `.env`; jangan di-commit atau ditempel ke chat.** Admin gateway juga perlu mengizinkan IP/origin server. |
| `TTE_TAG_COORDINATE` | Satu karakter marker posisi tanda tangan pada PDF (bawaan `€`, sesuai contoh panduan). |
| `PUBLIC_BASE_URL` | Alamat situs publik; dipakai pada QR verifikasi surat. |

Lambang pada kop surat: ganti `backend/app/assets/logo-konsel.png` (PNG transparan) dengan lambang resmi.

### Portal Masyarakat & Penandatanganan
- Warga mendaftar/masuk di `/masyarakat/masuk`; petugas masuk lewat URL `/login` (tidak ada tombolnya di situs publik).
- Semua layanan **nonaktif** sampai Camat mengaktifkannya di **Pelayanan & Persuratan → Pengaturan Layanan**.
- Alur: warga mengajukan → Admin Kecamatan verifikasi → Camat menandatangani di **Penandatanganan Surat** (NIK sekali, passphrase tiap kali) → warga mengunduh surat; keaslian dapat diperiksa lewat QR.
- Belum tersedia: pemulihan kata sandi warga dan verifikasi email (perlu penyedia email).

### Akun Uji Default (Password: `demo1234`)
| Username | Role | Cakupan |
| :--- | :--- | :--- |
| `superadmin` | `superadmin_kab` | Lintas 25 Kecamatan |
| `admin_laeya` | `admin_kecamatan` | Kecamatan Laeya |
| `camat_laeya` | `camat_sekcam` | Camat Laeya (Ansar) |
| `kasi_laeya` | `kasi_pelayanan` | Loket Pelayanan SIP-PAKADES Kec. Laeya |
| `op_torobulu` | `operator_desa` | Desa Torobulu |
| `op_puunggaluku` | `operator_desa` | Kel. Puunggaluku |

---

## 3. Menjalankan Frontend Next.js

```bash
cd frontend
cp .env.example .env.local
# Gunakan NEXT_PUBLIC_API_MODE=live untuk terhubung ke FastAPI (atau mock untuk simulasi tanpa backend)
npm install
npm run dev
```
- Portal Publik: `http://localhost:3000/`
- Login Petugas: `http://localhost:3000/login`
- Dashboard Admin (Light & Dark Mode): `http://localhost:3000/admin`

---

## 4. Pengujian & Pencadangan

### Frontend
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

### Backend
```bash
cd backend
source .venv/bin/activate
ruff check .
pytest -v
```

### Backup Database MySQL
```bash
./backend/scripts/backup_db.sh
```

---

## 5. Panduan Singkat Menambah Modul Baru (Pola `edusetara`)

1. **Backend:** Tambahkan model SQLAlchemy di `backend/app/models/`, buat migrasi `alembic revision --autogenerate`, tambahkan router di `backend/app/api/v1/endpoints/admin/<domain>/<fitur>/` dengan `CRUDBase` + dependency RBAC (`deps.py`), lalu daftarkan di `app/api/v1/router.py`.
2. **Frontend:** Buat folder `frontend/app/(admin)/admin/<domain>/<fitur>/` berisi `types.ts`, `hooks/crud.tsx` (TanStack Query), `components/` (`Form*Modal.tsx`, `Detail*Modal.tsx`), dan `page.tsx`, lalu daftarkan menu di `app/(admin)/_data/admin-menu.ts`.
