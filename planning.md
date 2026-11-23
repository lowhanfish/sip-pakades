# Planning Project: SIP-PAKADES (Kabupaten Konawe Selatan — Pilot: Kecamatan Laeya)

Dokumen perencanaan arsitektur, fitur, desain UI/UX, keamanan, kontrak API, skema database, dan tahapan pengembangan aplikasi **Sistem Informasi Pemerintahan & Pelayanan Administrasi Kecamatan dan Desa (SIP-PAKADES)** yang dirancang **multi-kecamatan** untuk wilayah **Kabupaten Konawe Selatan** dengan **Kantor Kecamatan Laeya** sebagai kecamatan *pilot / default* awal.

---

## 1. Gambaran Umum & Konteks Wilayah

- **Nama Aplikasi:** SIP-PAKADES (Skalabel Multi-Kecamatan, Kabupaten Konawe Selatan, Provinsi Sulawesi Tenggara).
- **Arsitektur Wilayah Dinamis:** Seluruh daftar kecamatan dan desa/kelurahan tidak di-*hardcode* di dalam kode, melainkan dikelola dinamis melalui **Master Kecamatan** (`master_districts`) dan **Master Desa/Kelurahan** (`master_villages`), meliputi profil, alamat kantor, koordinat peta, jam layanan, visi-misi, serta data pemerintahan masing-masing kecamatan.
- **Cakupan Master Awal (25 Kecamatan di Kabupaten Konawe Selatan):**
  - Andoolo, Andoolo Barat, Angata, Baito, Basala, Benua, Buke, Kolono, Kolono Timur, Konda, **Laeya**, Lainea, Lalembuu, Landono, Laonti, Moramo, Moramo Utara, Mowila, Palangga, Palangga Selatan, Ranomeeto, Ranomeeto Barat, Sabulakoa, Tinanggea, dan Wolasi.
- **Kecamatan *Pilot / Default* Awal — Kecamatan Laeya (17 Wilayah Desa/Kelurahan):**
  - **2 Kelurahan:** Ambalodangge, Puunggaluku *(Ibu Kota Kecamatan Laeya)*.
  - **15 Desa:** Aepodu, Ambakumina, Ambesea, Anduna, Anggoroboti, Labokeo, Laeya, Lambakara, Lamong Jaya, Lerepako, Ombu-Ombu Jaya, Puuwulo, Rambu-Rambu, Torobulu, Wonua Kongga.
- **Tujuan Sistem:**
  1. Menyediakan portal informasi penyelenggaraan pemerintahan kecamatan & desa/kelurahan (profil wilayah, perangkat, potensi wilayah, destinasi wisata, berita/regulasi publik, lokasi kantor, serta info/lacak layanan) yang mendukung pergantian/pemilihan kecamatan secara dinamis.
  2. Mendigitalisasi pelayanan administrasi kecamatan (PATEN) yang terhubung dengan pengantar desa/kelurahan, tata naskah persuratan dinas, dan pelaporan rutin triwulanan dari desa/kelurahan ke masing-masing kecamatan secara terisolasi, terpantau, dan aman.

---

## 2. Tech Stack & Keputusan Teknis

| Lapisan | Teknologi | Catatan Implementasi |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React 19, TypeScript (`strict`) | Menggunakan **Next.js standar** dengan tetap mempertahankan 100% struktur *route group*, pola modul fitur, store, hooks, dan *coding style* repositori referensi `edusetara` *(catatan: `edusetara` memakai `vinext` + `oxlint`, sedangkan proyek ini memakai Next.js standar + ESLint/TypeScript)* |
| **State & Data Fetching** | TanStack Query v5, Zustand v5 | *Server state* via TanStack Query (`hooks/crud.tsx`); *auth/URL/filter state* lintas halaman via Zustand |
| **UI, Animasi, Peta & Grafik** | Tailwind CSS v4, Framer Motion, Three.js / React Three Fiber, Leaflet + OpenStreetMap, SweetAlert2, Recharts / Highcharts, Tiptap *(opsional)* | Tema *soft sky blue* + *soft yellow*, *glassmorphism*, WebGL & *subtle 3D*; Leaflet + OSM gratis tanpa API key berbayar; notifikasi konsisten via `lib/show_swall.ts` |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, `pydantic-settings` | Dikelola via `pyproject.toml`, entrypoint `backend/main.py` (`uvicorn main:app`), mengikuti struktur & pola `edusetara` |
| **ORM & Migrasi** | SQLAlchemy 2.x Async (`asyncmy`), Alembic | Gaya deklaratif klasik `Column()` + mixin dasar (`MasterBaseMixin` & `OperationalBaseMixin`), migrasi terversi di `alembic/` |
| **Database** | MySQL 8.x | Relasional `utf8mb4_unicode_ci` dengan indeks komposit untuk filter desa, periode triwulan, jenis, dan status |
| **Keamanan & Autentikasi** | PyJWT, Argon2id (`argon2-cffi`), HttpOnly Cookies, CSRF Token | Rotasi refresh token (`refresh_sessions`), proteksi CSRF (`X-CSRF-Token`), serta *rate limiting* |
| **Ekspor & Cetak Dokumen** | `openpyxl` (Excel `.xlsx`), `weasyprint` / `reportlab` (PDF) | Rekap otomatis tabel & cetak draf surat rekomendasi/pengantar PDF |
| **Testing & Linter Backend** | `pytest`, `pytest-asyncio`, `httpx`, `aiosqlite`, `ruff` | Uji integrasi endpoint, aturan transisi status, dan isolasi RBAC antar-desa |
| **Background Task** | FastAPI `BackgroundTasks` *(v1)* / Celery + Redis *(opsional v2)* | v1 memakai `BackgroundTasks` untuk tugas ringan; Celery + Redis disiapkan sebagai ekstensi v2 untuk ekspor massal, pengingat batas waktu triwulan, dan backup terjadwal |

### Konfigurasi Database Lokal (Development)
- **Engine & Host:** MySQL 8.x lokal (`127.0.0.1:3306`) dengan charset `utf8mb4` dan collation `utf8mb4_unicode_ci`.
- **Konfigurasi Mesin Lokal:**
  - `DB_NAME`: `sippakades`
  - `DB_USER`: `root`
  - `DB_PASSWORD`: `root`
  - **Async Connection String:** `mysql+asyncmy://root:root@127.0.0.1:3306/sippakades`
- **Aturan Keamanan Repositori:** Kredensial lokal (`root`/`root`) **hanya** ditempatkan di `backend/.env` yang masuk daftar `.gitignore`. File `backend/.env.example` yang di-commit ke Git **wajib** memakai placeholder aman (bukan kredensial asli).

---

## 3. Arah Desain UI/UX, Light/Dark Mode Admin, WebGL & Aset WebP

- **Palet Warna:**
  - **Primary (*Soft Sky Blue*):** `#38BDF8` (aksen utama), `#7DD3FC` (highlight/border bercahaya), `#E0F2FE` & `#F0F9FF` (latar lembut nuansa langit).
  - **Accent (*Soft Yellow*):** `#FDE047` (CTA & sorotan utama), `#FEF08A` (lencana/pill highlight), `#FEF9C3` (tinted badge/alert lembut).
  - **Surface & Text:** Permukaan *frosted glass* putih semi-transparan (`rgba(255, 255, 255, 0.72)`) dipadukan teks *slate* gelap (`#0F172A`, `#334155`) agar kontras tetap tinggi dan nyaman dibaca.
- **Gaya Visual Modern:**
  - **Glassmorphism:** Kartu, navbar, sidebar dashboard, dan modal menggunakan `backdrop-blur-md`, border tipis semi-transparan (`border-sky-200/60`), dan bayangan lembut berwarna biru langit.
  - **Animasi Halus:** Transisi antar-seksi, *staggered card reveal*, dan *micro-interaction* tombol menggunakan Framer Motion.
  - **WebGL & Subtle 3D:**
    - *Hero section* landing page menggunakan kanvas 3D interaktif ringan berbasis Three.js / React Three Fiber (visualisasi gelombang geometris langit biru-kuning atau ilustrasi 3D stilistik kecamatan aktif).
    - Efek *subtle 3D tilt/depth* pada kartu profil desa/kelurahan, kartu layanan PATEN, dan destinasi wisata.
- **Aturan Teknis Optimasi WebGL di Perangkat Warga:**
  1. Seluruh komponen Three.js dimuat via **`next/dynamic` dengan `ssr: false`** agar tidak memblokir SSR dan *First Contentful Paint*.
  2. Resolusi render dibatasi dengan **`dpr={[1, 1.5]}`**, geometri ringan, serta jeda animasi otomatis saat tab tidak aktif.
  3. Mendukung **`prefers-reduced-motion`** dan menyediakan ***graceful fallback*** berupa latar gradien *soft sky blue–yellow* + kartu *glassmorphism* 2.5D apabila perangkat warga memiliki keterbatasan GPU/WebGL.

### Mode Light & Dark Khusus Modul Admin `(admin)`
- **Cakupan Terisolasi:** Tombol pengubah tema (*Light / Dark toggle*) ditempatkan di *topbar / header* area dashboard **`(admin)`**. Area publik `(publish)` dan halaman login `(auth)` tetap konsisten menggunakan tampilan cerah (*soft sky blue* + *soft yellow*) agar identitas portal publik tidak berubah.
- **Palet Dark Mode Admin:** Latar gelap *deep slate/navy* (`#0B1220`, `#111C2E`), permukaan *dark frosted glass* (`rgba(15, 23, 42, 0.72)`, `border-sky-400/20`), dan teks terang berdaya baca tinggi (`#F1F5F9`, `#CBD5E1`), dengan mempertahankan aksen *soft sky blue* (`#38BDF8`, `#7DD3FC`) dan *soft yellow* (`#FDE047`, `#FEF08A`).
- **Implementasi Teknis:** Dikelola lewat Zustand `store/useThemeStore.ts` (persist ke `localStorage` dengan key `sippakades-admin-theme`, default `"light"`), diterapkan sebagai atribut/kelas terisolasi (`.dark` / `data-admin-theme="dark"`) pada wrapper root `app/(admin)/admin/layout.tsx` menggunakan CSS variables di `globals.css` agar seluruh komponen UI, tabel, modal, badge, dan grafik beradaptasi mulus tanpa *flicker*.

### Aset Visual Resmi & Standar Format WebP
- **`frontend/public/img/logo-konsel.webp`:** Logo resmi 3D Kabupaten Konawe Selatan berlatar transparan (`.webp`), digunakan pada header & footer `(publish)`, halaman login `(auth)`, header/sidebar `(admin)`, ikon aplikasi, serta kop dokumen ekspor PDF dan draf surat rekomendasi.
- **`frontend/public/img/camat-laeya.webp`:** Foto resmi Camat Kecamatan Laeya (**Ansar**) berlatar transparan (`.webp`), digunakan pada seksi Sambutan Camat di landing page `(publish)` (ketika Kecamatan Laeya aktif) serta data awal perangkat pemerintahan Kecamatan Laeya pada seeder; untuk kecamatan lain, foto pimpinan tampil dinamis sesuai data masing-masing kecamatan.
- **Kebijakan Optimasi Media WebP:** Seluruh aset gambar statis UI maupun unggahan gambar publik (foto perangkat pemerintahan, galeri destinasi wisata, thumbnail berita) dikonversi otomatis ke format **`.webp`** (melalui library `Pillow` di `backend/app/services/upload_service.py`) demi kecepatan muat dan efisiensi penyimpanan; sedangkan dokumen privat pemohon dan lampiran resmi laporan (PDF/XLSX) tetap disimpan dalam format aslinya.

---

## 4. Arsitektur Folder, Coding Style & Kontrak API (Adaptasi Presisi `edusetara`)

Penamaan folder root menggunakan **`frontend/`** dan **`backend/`** sesuai kesepakatan proyek, sementara struktur internal, penamaan file fitur, dan pola pengkodean mengadopsi langsung repositori referensi `edusetara`.

```text
sip-pakades/
├── planning.md
├── frontend/                                     # Next.js App Router (adaptasi pola admin/ edusetara)
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── providers.tsx                         # QueryClientProvider (TanStack Query) & global wrappers
│   │   ├── (publish)/                            # Portal publik & landing page
│   │   │   ├── page.tsx                          # Beranda (Hero 3D, ringkasan pemerintahan, lacak, wisata)
│   │   │   ├── layout.tsx
│   │   │   ├── types.ts
│   │   │   ├── _components/
│   │   │   │   ├── site-header.tsx
│   │   │   │   ├── site-footer.tsx
│   │   │   │   └── site-navigation.ts
│   │   │   ├── components/                       # Seksi home-dashboard & shared landing components
│   │   │   ├── hooks/
│   │   │   ├── pemerintahan/                     # Profil kecamatan aktif (default: Laeya), struktur, berita, regulasi
│   │   │   ├── desa-kelurahan/                   # Direktori & detail desa/kelurahan per kecamatan + perangkat
│   │   │   ├── potensi-wilayah/                  # Katalog & grafik potensi wilayah kecamatan aktif
│   │   │   ├── destinasi-wisata/                 # Galeri & peta destinasi wisata
│   │   │   ├── layanan/                          # Info syarat PATEN & lacak status nomor registrasi
│   │   │   └── lokasi/                           # Peta kantor kecamatan aktif & desa/kelurahannya + kontak/jam layanan
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── (admin)/                              # Dashboard terproteksi (Kecamatan & Desa/Kelurahan)
│   │       ├── _components/
│   │       │   ├── admin-icons.tsx
│   │       │   ├── admin-page-scaffold.tsx
│   │       │   ├── admin-theme-toggle.tsx        # Tombol switcher Light/Dark khusus area (admin)
│   │       │   ├── chart/                        # Grafik pemantauan & rekap
│   │       │   └── ui/                           # Komponen UI bersama (tabel, badge, modal, glass card)
│   │       ├── _data/
│   │       │   └── admin-menu.ts                 # Definisi & filter menu berbasis role
│   │       └── admin/
│   │           ├── layout.tsx
│   │           ├── page.tsx                      # Ringkasan dashboard & widget status
│   │           ├── master/
│   │           │   ├── kecamatan/                # Master Kecamatan (profil kantor, koordinat, status aktif/default)
│   │           │   ├── desa/                     # Master Desa/Kelurahan (terikat district_id)
│   │           │   ├── jabatan/                  # Master Jabatan Perangkat Kecamatan & Desa/Kelurahan
│   │           │   ├── kategori-potensi/         # Master Kategori Potensi Wilayah
│   │           │   ├── kategori-wisata/          # Master Kategori Destinasi Wisata
│   │           │   ├── jenis-laporan/            # Master jenis pelaporan triwulanan
│   │           │   ├── periode-laporan/          # Master periode & tenggat triwulanan
│   │           │   ├── jenis-layanan/            # Master layanan PATEN & SLA
│   │           │   └── klasifikasi-surat/        # Master kode klasifikasi tata naskah dinas
│   │           ├── pemerintahan/
│   │           │   ├── profil-wilayah/           # Profil kecamatan & desa/kelurahan
│   │           │   ├── perangkat/                # Perangkat pemerintahan kecamatan & desa
│   │           │   ├── potensi/                  # Potensi wilayah
│   │           │   └── wisata/                   # Destinasi wisata
│   │           ├── pelaporan/
│   │           │   ├── triwulan/                 # Input, ajukan, revisi & riwayat laporan triwulanan
│   │           │   └── verifikasi/               # Antrean verifikasi & catatan perbaikan kecamatan
│   │           ├── pelayanan/
│   │           │   └── permohonan/               # Loket PATEN, unggah syarat privat, proses & cetak draf
│   │           ├── persuratan/
│   │           │   ├── surat-masuk/              # Pencatatan surat masuk & disposisi Camat/Sekcam
│   │           │   └── surat-keluar/             # Penomoran otomatis & arsip surat keluar
│   │           ├── pemantauan/
│   │           │   ├── kelengkapan-ketepatan/    # Matriks kelengkapan data & ketepatan waktu desa/kelurahan
│   │           │   └── rekap-ekspor/             # Rekap otomatis & unduh Excel/PDF
│   │           ├── publikasi/
│   │           │   ├── berita/                   # Berita & pengumuman pemerintahan
│   │           │   └── regulasi/                 # Dokumen publik (Perdes, SK, SOP layanan)
│   │           └── sistem/
│   │               ├── pengguna/                 # Manajemen user & role
│   │               ├── audit-log/                # Riwayat perubahan & akses dokumen sensitif
│   │               └── pencadangan/              # Monitoring status backup & trigger backup admin
│   ├── public/
│   │   └── img/
│   │       ├── logo-konsel.webp                  # Logo resmi Kab. Konawe Selatan (transparan WebP)
│   │       └── camat-laeya.webp                  # Foto resmi Camat Laeya - Ansar (transparan WebP)
│   ├── components/
│   │   ├── three/                                # Komponen WebGL / R3F (HeroCanvas, Subtle3DCard)
│   │   └── maps/                                 # Peta Leaflet + OpenStreetMap (reusable)
│   ├── lib/
│   │   ├── api.ts                                # Fetcher publik & tipe ApiResponse
│   │   ├── api_secure.ts                         # Fetcher terautentikasi (credentials, CSRF, 401 refresh)
│   │   ├── show_swall.ts                         # Wrapper notifikasi SweetAlert2
│   │   └── mock/                                 # Lapisan mock adapter sementara (NEXT_PUBLIC_API_MODE=mock)
│   │       ├── index.ts                          # Router interceptor yang mematuhi 100% Kontrak API SSOT
│   │       ├── seed-data.ts                      # Data simulasi realistis 25 kec. Konsel & 17 desa Laeya
│   │       └── handlers.ts                       # Handler CRUD, auth multi-role, & simulasi workflow
│   ├── store/
│   │   ├── useAuthStore.ts                       # State user login, role, district_id, village_id (Zustand)
│   │   ├── useUrlStore.ts                        # URL API terpusat dari NEXT_PUBLIC_API_URL
│   │   ├── useFilterStore.ts                     # State filter berjenjang (district_id, village_id, tahun, triwulan, status)
│   │   └── useThemeStore.ts                      # State tema Light/Dark khusus (admin), persist localStorage
│   ├── types/
│   │   └── global.ts                             # Tipe generik (ListOptionSchema, Pagination, Enum Status)
│   └── utilities/
│       └── pagination.ts                         # Helper paginasi & formatter periode/tanggal
│
└── backend/                                      # FastAPI + MySQL (adaptasi pola server/ edusetara)
    ├── main.py                                   # Entrypoint FastAPI (uvicorn main:app)
    ├── pyproject.toml                            # Konfigurasi dependencies, ruff, & pytest
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    ├── .env.example
    ├── scripts/
    │   ├── backup_db.sh                          # Skrip mysqldump terkompresi + retensi
    │   └── seed_initial.py                       # Runner seeding master & akun awal
    ├── tests/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_rbac_isolation.py                # Uji isolasi data antar-kecamatan, antar-desa, & dokumen privat
    │   ├── test_reports_workflow.py              # Uji transisi status pelaporan & penguncian draf
    │   └── test_services_workflow.py             # Uji alur PATEN & pelacakan publik
    └── app/
        ├── api/
        │   ├── deps.py                           # Dependency AsyncSession, current_user, RBAC, district_id & village_id scope
        │   └── v1/
        │       ├── router.py                     # Agregasi seluruh router di bawah prefix /api/v1
        │       └── endpoints/
        │           ├── auth/                     # route.py, schema.py, service.py
        │           ├── users/                    # route.py, schema.py, service.py
        │           ├── publish/                  # Endpoint publik (multi-kecamatan via slug/district_id, tanpa data pribadi)
        │           └── admin/                    # Router per domain: master, pemerintahan, pelaporan,
        │               │                         # pelayanan, persuratan, pemantauan, publikasi, sistem
        │               └── <domain>/<fitur>/     # Pola per fitur: <fitur>.py & schema.py (colocated)
        ├── core/
        │   ├── config.py                         # Pydantic Settings (.env)
        │   ├── cookies.py                        # Pengaturan HttpOnly access/refresh/csrf cookies
        │   ├── csrf.py                           # Validasi X-CSRF-Token untuk mutasi
        │   ├── exceptions.py                     # Handler exception standar
        │   ├── lifespan.py                       # Startup/shutdown engine & direktori storage
        │   ├── logging.py                        # Structured logging
        │   ├── rate_limit.py                     # Pembatasan request (login & lacak layanan publik)
        │   └── security.py                       # Argon2id hashing & PyJWT encode/decode
        ├── db/
        │   ├── base.py                           # SQLAlchemy Declarative Base
        │   ├── engine.py                         # Async engine MySQL (asyncmy)
        │   ├── session.py                        # AsyncSession factory
        │   ├── transaction.py                    # commit_or_raise_unique_conflict & rollback helper
        │   ├── seed_master.py                    # Seeder 25 kec. Konsel (Laeya default), 17 desa/kel. Laeya, jabatan, kategori potensi/wisata, laporan, layanan, klasifikasi surat
        │   └── seed_publish.py                   # Seeder konten awal landing page (fiktif/non-sensitif)
        ├── global_schemas/
        │   ├── master/base_schema.py
        │   └── operational/base_schema.py
        ├── models/
        │   ├── auth/                             # user.py, role.py, refresh_session.py, menu.py
        │   ├── master/                           # base_master.py, district.py, village.py, official_position.py, potential_category.py, tourism_category.py, report_type.py, report_period.py, service_type.py, letter_classification.py
        │   ├── operational/                      # base.py (OperationalBaseMixin), official.py, report.py, service_request.py, letter.py, potential.py, tourism.py, publication.py
        │   └── audit.py                          # audit_logs & backup_logs
        └── services/
            ├── crud_service.py                   # Generic CRUDBase[ModelType]
            ├── upload_service.py                 # Validasi file, konversi gambar publik ke WebP, SHA-256, simpan privat vs publik
            ├── workflow_service.py               # Mesin transisi status laporan, layanan, & disposisi
            ├── monitoring_service.py             # Hitung kelengkapan, ketepatan waktu, & SLA
            └── export_service.py                 # Generator Excel (.xlsx) & PDF
```

### Konvensi Coding Style & Kontrak Integrasi (`edusetara` Pattern)
1. **Struktur Wajib Modul Fitur Frontend:** Setiap modul di `app/(admin)/admin/<domain>/<fitur>/` wajib berisi:
   - `page.tsx` (komposisi tabel, pencarian *debounce*, filter, paginasi, aksi).
   - `types.ts` (kontrak tipe konkret TypeScript tanpa `any` yang tidak perlu).
   - `hooks/crud.tsx` (query & mutation TanStack Query; `queryKey` menyertakan nama fitur + seluruh parameter filter/paginasi).
   - `components/` (`Form*Modal.tsx` & `Detail*Modal.tsx` terpisah).
2. **Kontrak Response & Paginasi:**
   - **Endpoint Auth (`/api/v1/auth/*`):** Menggunakan envelope `{success, message, data}`.
   - **Endpoint List CRUD (`/api/v1/admin/.../read`):** Mengembalikan `{total, skip, limit, data}` dengan konversi frontend `skip = (page - 1) * limit` dan parameter `search` *debounced* serta filter server-side (`district_id`, `village_id`, `period_year`, `period_quarter`, `status`, `type_id`).
   - **Endpoint Option Dropdown (`/option`):** Mengembalikan daftar ringkas `{id, nama/uraian, ...}` untuk select/combobox (termasuk *cascading dropdown* `district_id` → `village_id`).
3. **Autentikasi & Request Aman (`lib/api_secure.ts`):**
   - Pengiriman cookie via `credentials: "include"`.
   - Injeksi otomatis header `X-CSRF-Token` dari cookie `csrf_token` pada method `POST`, `PUT`, `PATCH`, `DELETE`.
   - Mekanisme *single-flight* `refreshPromise` saat menerima HTTP `401` agar permintaan paralel tidak memicu konflik *replay refresh token*.
   - Seluruh base URL berasal dari `store/useUrlStore.ts` (`NEXT_PUBLIC_API_URL`).
4. **Pola Backend Python:**
   - Setiap router fitur menggunakan `APIRouter`, `async def`, `Depends` (`AsyncSession`, `get_current_user`, guard role, `district_id` & `village_id`).
   - Model SQLAlchemy 2.x memakai gaya deklaratif `Column()` + mixin dasar; operasi standar memakai `CRUDBase`, sedangkan transisi status, upload terproteksi, rekap, dan ekspor dipisahkan ke `app/services/`.
5. **Mode `mock` vs `live` (`NEXT_PUBLIC_API_MODE`):**
   - Seluruh halaman dan `hooks/crud.tsx` wajib tetap memanggil `lib/api.ts` dan `lib/api_secure.ts` tanpa logika percabangan `mock` di komponen UI.
   - Selama fase *Frontend-First*, `NEXT_PUBLIC_API_MODE=mock` mengarahkan request ke `lib/mock/` dengan bentuk payload & response yang identik terhadap Kontrak Data SSOT; saat backend siap, perpindahan ke backend FastAPI cukup mengubah environment variable menjadi `NEXT_PUBLIC_API_MODE=live`.

---

## 5. Rincian Fitur & Modul Utama

### A. Landing Page & Portal Publik `(publish)` + Area Login `(auth)`
- **Pemilih Kecamatan Dinamis (*District Switcher* / Parameter `district`):** Portal publik memuat data berdasarkan kecamatan aktif yang dipilih pada header (dengan **Kecamatan Laeya** sebagai *default* awal), sehingga ketika kecamatan lain diaktifkan melalui Master Kecamatan, seluruh tampilan publik (profil, daftar desa/kelurahan, potensi, wisata, peta kantor, dan pelacakan layanan) langsung menyesuaikan secara dinamis tanpa perubahan kode.

1. **Hero Section 3D Interaktif & Identitas Resmi:** Identitas kecamatan aktif (default: Kecamatan Laeya) menampilkan logo resmi Kabupaten Konawe Selatan (`logo-konsel.webp`) pada header/identitas portal, kanvas WebGL bernuansa *soft sky blue* & *soft yellow*, akses cepat layanan warga, dan tombol **Login Petugas** menuju `/login`.
2. **Sambutan Pimpinan & Informasi Penyelenggaraan Pemerintahan (`/pemerintahan`):**
   - **Seksi Sambutan Camat / Pimpinan Kecamatan Aktif:** Menampilkan profil singkat dan foto resmi pimpinan kecamatan (default Kecamatan Laeya menampilkan foto resmi Camat **Ansar** dari `camat-laeya.webp` dalam bingkai *glassmorphism*).
   - Visi-misi, tugas pokok kecamatan, dan bagan struktur organisasi kecamatan aktif.
   - Berita & pengumuman resmi kegiatan pemerintahan kecamatan/desa.
   - Direktori dokumen regulasi & transparansi publik (Perdes, SK Camat publik, maklumat & SOP layanan).
3. **Profil Desa/Kelurahan (`/desa-kelurahan`):**
   - Direktori dan halaman detail seluruh desa & kelurahan di kecamatan aktif (untuk Kec. Laeya: 2 kelurahan dan 15 desa) mencakup sejarah singkat, batas wilayah, luas wilayah, demografi ringkas, jumlah dusun/RT/RW, dan daftar perangkat aktif.
4. **Potensi Wilayah (`/potensi-wilayah`):**
   - Katalog potensi unggulan per wilayah dan kategori dari `master_potential_categories` (pertanian, perkebunan, perikanan/kelautan seperti koridor Torobulu, peternakan, UMKM/perdagangan) lengkap dengan angka/satuan untuk visualisasi grafik.
5. **Destinasi Wisata (`/destinasi-wisata`):**
   - Katalog destinasi wisata lokal sesuai kategori `master_tourism_categories`, lengkap dengan deskripsi, fasilitas, galeri foto, dan titik koordinat peta.
6. **Lokasi Kantor Kecamatan & Wilayah (`/lokasi`):**
   - Peta interaktif **Leaflet + OpenStreetMap** yang menampilkan lokasi Kantor Kecamatan aktif (default: Puunggaluku, Kec. Laeya) dan sebaran desa/kelurahannya, dilengkapi alamat, jam pelayanan PATEN, dan kontak resmi.
7. **Info Persyaratan & Lacak Status Pelayanan (`/layanan`):**
   - Daftar persyaratan dan estimasi waktu (`sla_days`) tiap layanan PATEN.
   - Fitur **Lacak Status Permohonan** berbasis nomor registrasi (dilindungi `rate_limit`): hanya menampilkan status progres (`diterima` / `perlu_kelengkapan` / `diproses` / `selesai`), jenis layanan, asal kecamatan/desa, dan nama pemohon yang di-*masking* (contoh: `A*** S***`) tanpa mengekspos NIK atau berkas pribadi.

### B. Data Pemerintahan & Publikasi `(admin/pemerintahan` & `admin/publikasi)`
- **Profil Wilayah & Perangkat Pemerintahan:** Pengelolaan profil masing-masing kecamatan dan desa/kelurahannya; data perangkat mengacu ke `master_official_positions` (Camat, Sekcam, Kasi, Kepala Desa/Lurah, Sekretaris Desa, Kepala Dusun/Lingkungan, BPD) lengkap dengan jabatan, SK/masa jabatan, kontak dinas, dan status aktif.
- **Potensi Wilayah & Destinasi Wisata:** Dikelola oleh Kecamatan maupun Operator Desa (khusus wilayahnya) mengacu ke master kategori agar data publik selalu mutakhir dan terstandardisasi.
- **Publikasi Berita & Regulasi:** Pengelolaan berita/pengumuman dan unggah dokumen regulasi publik berformat PDF per kecamatan/desa.

### C. Pelaporan Rutin (Per Triwulan) + Master Data `(admin/pelaporan` & `admin/master)`
- **Master Jenis Pelaporan (`master_report_types`):** Dikelola Admin Kecamatan, mencakup 4 jenis laporan rutin utama (dapat ditambah sesuai kebutuhan):
  1. Laporan Penyelenggaraan Pemerintahan Desa/Kelurahan (Triwulanan).
  2. Laporan Realisasi Keuangan / APBDes Triwulanan.
  3. Laporan Kependudukan & Ketenteraman/Ketertiban Umum (Trantibum).
  4. Laporan Pembangunan, Aset Desa, & Pembaruan Potensi Wilayah.
- **Master Periode & Tenggat Waktu (`report_periods`):** Mengatur `period_year`, `period_quarter` (TW I–IV), `deadline_at`, dan status buka/tutup periode (`is_open`) sebagai dasar perhitungan ketepatan waktu otomatis.
- **Format Pengisian:** Kombinasi **form ringkasan terstruktur** (indikator/angka kunci untuk rekap otomatis) + **lampiran dokumen resmi** (PDF/Excel dengan penyimpanan hash `SHA-256`).
- **Alur Status & Aturan Penguncian:**
  - `draf`: Bebas diubah oleh Operator Desa; **belum masuk** antrean verifikasi Kecamatan.
  - `diajukan`: Mencatat `submitted_at` dan `submission_version`; data & lampiran **terkunci** selama diperiksa petugas/verifikator Kecamatan.
  - `perlu_perbaikan`: Verifikator wajib mengisi `revision_note`; kunci dibuka kembali agar Operator Desa dapat memperbaiki data/berkas lalu mengajukan ulang.
  - `terverifikasi`: Status final (terkunci permanen), mencatat `verified_by` dan `verified_at`.
  - Seluruh perpindahan status dan catatan dicatat pada tabel **`report_status_histories`**.

### D. Pelayanan Administrasi (Kecamatan & Desa/Kelurahan — PATEN) `(admin/pelayanan)`
- **3 Layanan Utama v1** (mengacu kewenangan kecamatan pada PP No. 17 Tahun 2018, masing-masing memiliki target waktu `sla_days` di `master_service_types`):
  1. **Rekomendasi / Dispensasi Nikah** (surat pengantar/rekomendasi ke KUA, termasuk dispensasi nikah < 10 hari kerja).
  2. **Rekomendasi Izin Usaha Mikro & Kecil (IUMK) / Keterangan Usaha**.
  3. **Pengantar Administrasi Kependudukan & Pertanahan** (rekomendasi pindah datang antar-kecamatan/kabupaten, SKTM keperluan khusus/RS/beasiswa, serta pengesahan/register surat keterangan ahli waris).
- **Keterlibatan Desa/Kelurahan & Loket Kecamatan:**
  - Mendukung pengajuan dari **Operator Desa/Kelurahan** (menyertakan unggahan **Surat Pengantar Desa/Kelurahan** beserta berkas warga desanya) maupun input langsung oleh **Petugas Loket PATEN Kecamatan** (atau pengajuan awal dari portal publik bila diaktifkan).
- **Alur Status Pelayanan & Riwayat (`service_status_histories`):**
  `diterima` → `perlu_kelengkapan` *(disertai catatan kekurangan berkas)* → `diproses` → `selesai`.
- **Integrasi Output:** Permohonan berstatus `selesai` dapat menghasilkan **cetak draf PDF surat rekomendasi/keterangan** dan tertaut ke buku agenda **Surat Keluar**.

### E. Persuratan Kecamatan (Tata Naskah Dinas — Permendagri No. 1 Tahun 2023) `(admin/persuratan)`
- **Master Klasifikasi Kode Surat (`master_letter_classifications`):** Kode klasifikasi resmi (misalnya `140` Pemerintahan Desa, `400` Kesejahteraan Rakyat, `500` Perekonomian, `800` Kepegawaian) untuk penomoran surat keluar otomatis.
- **Surat Masuk & Disposisi:** Pencatatan surat masuk (dari desa/kelurahan di lingkup kecamatan, OPD kabupaten, atau masyarakat), unggah scan PDF, serta lembar disposisi berjenjang dari Camat/Sekcam ke Kasi terkait dengan status tindak lanjut (`baru` → `didisposisikan` → `ditindaklanjuti` → `selesai`).
- **Surat Keluar:** Pencatatan dan penomoran otomatis surat keluar (Surat Pengantar, Surat Rekomendasi, Surat Keterangan, Surat Tugas/Undangan) beserta arsip PDF tertandatangani.

### F. Pemantauan, Pencarian, & Rekap Otomatis `(admin/pemantauan)`
- **3 Pilar Indikator Pemantauan Terukur (Dinamis per Kecamatan):**
  1. **Kelengkapan Data Wilayah (`%`):** Dihitung dinamis berdasarkan jumlah desa/kelurahan aktif di kecamatan terpilih (misalnya 17 wilayah pada Kec. Laeya) dari keterisian profil desa, minimal perangkat aktif, data potensi wilayah, dan destinasi wisata.
  2. **Ketepatan Waktu Pelaporan Triwulanan:** Membandingkan `submitted_at` terhadap `report_periods.deadline_at`:
     - `Tepat Waktu`: diajukan/terverifikasi `<= deadline_at`.
     - `Terlambat`: diajukan `> deadline_at`.
     - `Perlu Perbaikan`: dikembalikan untuk revisi.
     - `Belum Lapor`: belum ada laporan atau masih berstatus `draf` melewati tenggat.
  3. **Penyelesaian Pelayanan Administrasi (SLA):** Distribusi status permohonan, rata-rata waktu penyelesaian (hari kerja), serta rasio ketepatan terhadap `sla_days`.
- **Pencarian & Penyaringan Terpadu:** Pencarian *debounced* dan filter berjenjang *server-side* berdasarkan `district_id` (Kecamatan) → `village_id` (Desa/Kelurahan), `period_year` & `period_quarter`, `jenis layanan/laporan`, dan `status`.
- **Rekap Otomatis & Ekspor (`openpyxl` `.xlsx` & `weasyprint`/`reportlab` `.pdf`):**
  1. Rekap Kelengkapan Data Desa/Kelurahan per Kecamatan.
  2. Rekap Pelaporan Triwulanan & Ketepatan Waktu per Wilayah/Periode.
  3. Rekap Pelayanan Administrasi & Kepatuhan SLA.
  4. Buku Agenda Surat Masuk, Disposisi, & Surat Keluar.

---

## 6. Unsur Wajib, Matriks RBAC, Pengamanan & Pencadangan

### Pemenuhan 6 Unsur Penting Aplikasi
| Unsur Wajib | Implementasi Teknis |
| :--- | :--- |
| **1. Identitas & Periode Data** | Setiap record menyimpan identitas kecamatan & wilayah asal (`district_id` dan `village_id` — di mana `village_id` dapat bernilai `NULL` untuk data level kantor kecamatan), jenis data (`report_type_id` / `service_type_id`), serta periode (`period_year`, `period_quarter` TW I–IV atau tanggal pengajuan). |
| **2. Penanggung Jawab & Waktu** | Setiap entitas operasional menyimpan `created_by` (pengisi), `updated_by` (pembaru terakhir), `verified_by` (pemeriksa), beserta `created_at`, `updated_at`, dan `verified_at`. |
| **3. Status yang Jelas** | Enum status baku + tabel riwayat transisi (`report_status_histories` & `service_status_histories`) agar setiap perubahan status punya alasan dan jejak waktu. |
| **4. Pencarian & Penyaringan** | Seluruh daftar data mendukung query parameter server-side: `search`, `district_id`, `village_id`, `period_year`, `period_quarter`, `type_id`, dan `status`. |
| **5. Rekap Otomatis** | Agregasi langsung dari database terverifikasi/tercatat menjadi kartu ringkasan, grafik, serta ekspor Excel (`.xlsx`) dan PDF siap cetak. |
| **6. Hak Akses & Pengamanan** | RBAC tervalidasi di backend, pembatasan dokumen pribadi pemohon, audit log menyeluruh, serta pencadangan database terjadwal. |

### Matriks Hak Akses (RBAC)
> **Prinsip Utama:** Pemeriksaan role dan kepemilikan cakupan wilayah (`district_id` dan `village_id`) wajib ditegakkan di dependency backend (`app/api/deps.py`), bukan hanya menyembunyikan menu di frontend.

| Modul / Aksi | Superadmin Kab. / Sistem | Admin Kecamatan | Camat / Sekcam | Kasi / Petugas Layanan | Operator Desa/Kelurahan | Publik *(Landing Page)* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Master Global (Kecamatan, Desa, Master Standar)** | **Penuh (Lintas Kec.)** | Kelola Desa di `district_id`-nya | Lihat | Lihat | — | — |
| **Manajemen User** | **Penuh (Lintas Kec.)** | Kelola User di `district_id`-nya | Lihat | — | — | — |
| **Profil Wilayah, Perangkat, Potensi, Wisata** | Penuh | **Penuh (`district_id`)** | Lihat (`district_id`) | Lihat (`district_id`) | **Hanya `village_id` sendiri** | Lihat Ringkas Publik |
| **Pelaporan Triwulanan (Input / Revisi)** | Pantau | Kelola (`district_id`) | Lihat (`district_id`) | Lihat Bidang | **Hanya `village_id` sendiri** | — |
| **Verifikasi Laporan Triwulanan** | — / Override | Admin (`district_id`) | **Verifikasi Akhir (`district_id`)** | **Verifikasi Bidang (`district_id`)** | — | — |
| **Pelayanan Administrasi (PATEN)** | Pantau | Kelola (`district_id`) | Pantau & Setujui | **Proses Penuh (`district_id`)** | **Ajukan/Pantau pengantar desanya** | Info Syarat & Lacak *(masked)* |
| **Akses Unduh Dokumen Pribadi Pemohon** | Audit / Terbatas | Audit (`district_id`) | Terbatas (`district_id`) | **Berwenang Penuh (`district_id`)** | Hanya berkas unggahan desanya | **Dilarang** |
| **Persuratan & Disposisi Kecamatan** | Pantau | Penuh (`district_id`) | **Disposisi & Pantau** | Tindak Lanjut Disposisi | — | — |
| **Pemantauan & Ekspor Rekap** | **Penuh (Lintas Kec.)** | Penuh (`district_id`) | Penuh (`district_id`) | Sesuai Bidang (`district_id`) | Rekap `village_id`-nya sendiri | — |
| **Audit Log & Pencadangan DB** | **Penuh** | Audit Log `district_id`-nya | Lihat Ringkasan | — | — | — |

### Standar Keamanan Aplikasi, Dokumen Pribadi, & Pencadangan
1. **Keamanan Sesi & API:** Password di-hash menggunakan **Argon2id**; token disimpan pada **HttpOnly Cookie**; refresh token dicatat di `refresh_sessions` (mendukung rotasi & logout semua perangkat); mutasi dilindungi **CSRF Token**; endpoint login dan pelacakan publik dilindungi **rate limiter**.
2. **Pengamanan Dokumen Pribadi Pemohon (`service_documents`):**
   - Validasi ketat tipe file (PDF, JPG, PNG; serta XLSX untuk lampiran laporan) menggunakan pengecekan ekstensi dan *magic bytes*/MIME, serta batas ukuran file (misalnya maks. 5 MB per berkas).
   - File disimpan di **direktori penyimpanan privat** di luar folder publik web dengan nama **UUID acak** (bukan nama asli file) disertai penyimpanan hash **`SHA-256`**.
   - Pengunduhan hanya melalui endpoint terautentikasi (`/api/v1/admin/pelayanan/dokumen/{id}/download`) setelah validasi role berwenang, dan setiap aksi unduh otomatis dicatat ke `audit_logs`.
3. **Riwayat Perubahan (`audit_logs`):** Mencatat `user_id`, `action` (`LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `DOWNLOAD_PRIVATE_DOC`, `EXPORT`, `BACKUP`), `entity_type`, `entity_id`, `before_data`/`after_data`, `ip_address`, dan `created_at`.
4. **Pencadangan & Pemulihan (Backup & Restore):**
   - Skrip `backend/scripts/backup_db.sh` menjalankan `mysqldump --single-transaction` dengan kompresi `.sql.gz`, rotasi retensi berkala (misal 14/30 hari), dan pencatatan status hasil backup ke tabel `backup_logs` agar dapat dipantau Superadmin di dashboard.

---

## 7. Rancangan Entitas Database Inti (MySQL)

Mengikuti pengelompokan model `edusetara` (`models/auth/`, `models/master/`, `models/operational/`):

1. **Domain Auth (`models/auth/`):**
   - `users`, `roles`, `menus`, `role_permissions`, `refresh_sessions` (`users` menyimpan `district_id` [nullable untuk Superadmin Kabupaten] dan `village_id` [nullable untuk level Kecamatan/Kabupaten]).
2. **Domain Master (`models/master/`):**
   - `master_districts` — Master Kecamatan (kode Kemendagri/wilayah, nama, slug, tipe, alamat kantor, jam layanan, visi-misi, koordinat lat/lng, `is_active`, `is_default`).
   - `master_villages` — Master Desa/Kelurahan terhubung ke `district_id` (kode wilayah, nama, tipe `desa`/`kelurahan`, deskripsi profil, luas, batas wilayah, koordinat lat/lng, `is_active`).
   - `master_official_positions` — Master Jabatan Perangkat Kecamatan & Desa/Kelurahan (kode, nama jabatan, level `kecamatan`/`desa`, urutan tampil).
   - `master_potential_categories` — Master Kategori Potensi Wilayah (pertanian, perkebunan, perikanan/kelautan, peternakan, UMKM, dll.).
   - `master_tourism_categories` — Master Kategori Destinasi Wisata (bahari, alam, budaya, agro, religi, dll.).
   - `master_report_types` — Master jenis pelaporan triwulanan (kode, nama, deskripsi, skema indikator ringkas, lampiran wajib).
   - `report_periods` — Master periode triwulan (`year`, `quarter`, `deadline_at`, `is_open`).
   - `master_service_types` — Master jenis layanan PATEN (kode, nama, daftar syarat, `sla_days`, template surat).
   - `master_letter_classifications` — Master klasifikasi kode surat tata naskah dinas.
3. **Domain Operasional (`models/operational/`):**
   > Seluruh tabel operasional membawa kolom `district_id` (serta `village_id` bila berada di level desa/kelurahan) guna menjamin isolasi data dan agregasi multi-kecamatan yang konsisten.
   - `government_officials` — Data perangkat pemerintahan kecamatan (`village_id = NULL`) dan desa/kelurahan, merujuk `position_id`.
   - `government_announcements`, `government_regulations` — Berita/pengumuman serta dokumen regulasi/SOP publik.
   - `regional_potentials`, `tourist_destinations` — Potensi wilayah (merujuk `potential_category_id`, nilai/satuan) dan destinasi wisata (merujuk `tourism_category_id`, fasilitas, galeri, koordinat).
   - `quarterly_reports`, `report_attachments`, `report_status_histories` — Data pelaporan triwulanan, lampiran (`file_path`, `sha256_hash`), versi pengajuan, status, catatan revisi, dan riwayat status.
   - `service_requests`, `service_documents`, `service_status_histories` — Permohonan layanan PATEN (`registration_number`, `district_id`, `village_id`, `service_type_id`, `status`, `sla_due_at`), dokumen privat pemohon, dan riwayat status.
   - `incoming_letters`, `letter_dispositions`, `outgoing_letters` — Persuratan masuk, disposisi Camat/Sekcam, dan surat keluar bernomor otomatis.
4. **Domain Audit & Sistem:**
   - `audit_logs` — Jejak audit seluruh aktivitas penting & akses dokumen privat.
   - `backup_logs` — Riwayat eksekusi pencadangan database.

---

## 8. Kontrak Data (API Contract SSOT) & Strategi Frontend-First

Karena pengembangan difokuskan pada sisi **Frontend terlebih dahulu** sebelum **Backend FastAPI**, seluruh tipe data, bentuk request/response, enum status, dan daftar endpoint dikunci di bawah ini sebagai **Single Source of Truth (SSOT)** (mengadaptasi disiplin `API_CONTRACT_ADMIN.md` pada `edusetara`).

### 8.1 Aturan Umum Kontrak
- **Base Prefix & Format:** Seluruh endpoint berada di bawah `/api/v1`; format timestamp memakai ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`); seluruh primary key (`id`) bertipe UUID v4 (`string`).
- **Field Otomatis Backend:** Field seperti `id`, `created_by`, `updated_by`, `verified_by`, `created_at`, `updated_at`, `verified_at`, `sha256_hash`, `registration_number`, `submitted_at`, dan `submission_version` dihasilkan/diinjeksi otomatis oleh backend dan tidak boleh dipercaya dari input bebas pengguna.
- **Format Standar Respons API:**
  - **Auth & Operasi Tunggal / Mutasi (`GET by id`, `POST`, `PUT`, `PATCH`, `DELETE`):**
    ```json
    {
      "success": true,
      "message": "Operasi berhasil",
      "data": {}
    }
    ```
  - **Daftar Data / List CRUD (`/read`):**
    ```json
    {
      "total": 45,
      "skip": 0,
      "limit": 10,
      "data": []
    }
    ```
    *Query parameters standar:* `skip`, `limit`, `search`, `district_id`, `village_id`, `period_year`, `period_quarter`, `type_id`, `status`, `sort_by`, `sort_dir`.
  - **Dropdown Option (`/option`):**
    ```json
    [
      { "id": "uuid", "label": "Kecamatan Laeya", "code": "740511", "meta": {} }
    ]
    ```
  - **Respons Galat (Error — HTTP `400`/`401`/`403`/`404`/`409`/`422`/`429`/`500`):**
    ```json
    {
      "success": false,
      "message": "Rincian pesan validasi atau alasan kegagalan",
      "code": "VALIDATION_ERROR",
      "errors": [
        { "field": "village_id", "message": "Desa/Kelurahan wajib dipilih" }
      ]
    }
    ```

### 8.2 Daftar Enum Baku Terkunci
- **`RoleCode`:** `superadmin_kab`, `admin_kecamatan`, `camat_sekcam`, `kasi_pelayanan`, `operator_desa`
- **`VillageType`:** `desa`, `kelurahan`
- **`ReportStatus`:** `draf`, `diajukan`, `perlu_perbaikan`, `terverifikasi`
- **`ServiceStatus`:** `diterima`, `perlu_kelengkapan`, `diproses`, `selesai`
- **`DispositionStatus`:** `baru`, `didisposisikan`, `ditindaklanjuti`, `selesai`
- **`TimelinessStatus`:** `tepat_waktu`, `terlambat`, `perlu_perbaikan`, `belum_lapor`

### 8.3 Matriks Endpoint Kontrak Inti (`/api/v1`)

| Domain | Endpoint Utama | Keterangan Kontrak |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me` | Envelope `{success, message, data}` + HttpOnly cookie & `csrf_token` |
| **Publik `(publish)`** | `GET /publish/districts`, `GET /publish/districts/{slug}/overview`, `GET /publish/districts/{slug}/villages`, `GET /publish/districts/{slug}/potentials`, `GET /publish/districts/{slug}/tourism`, `GET /publish/districts/{slug}/publications`, `GET /publish/services/types`, `GET /publish/services/track/{registration_number}` | Tanpa data sensitif/NIK; pelacakan mengembalikan nama *masked* |
| **Master Data (9 Modul)** | `GET /admin/master/{kecamatan\|desa\|jabatan\|kategori-potensi\|kategori-wisata\|jenis-laporan\|periode-laporan\|jenis-layanan\|klasifikasi-surat}/{read\|option}`, `POST .../create`, `PUT .../update/{id}`, `DELETE .../delete/{id}` | Mendukung *cascading filter* `district_id` pada `/desa/option` & `/desa/read` |
| **Pemerintahan & Publikasi** | `/admin/pemerintahan/{profil-wilayah\|perangkat\|potensi\|wisata}/{read\|create\|update/{id}\|delete/{id}}`, `/admin/publikasi/{berita\|regulasi}/{read\|create\|update/{id}\|delete/{id}}` | Terisolasi sesuai `district_id` & `village_id` user login |
| **Pelaporan Triwulanan** | `GET /admin/pelaporan/triwulan/read`, `POST .../create`, `PUT .../update/{id}`, `DELETE .../delete/{id}`, `POST .../{id}/attachments`, `POST .../{id}/submit`, `POST .../{id}/verify`, `GET .../{id}/histories` | Validasi kunci draf saat `diajukan` & wajib `revision_note` saat dikembalikan |
| **Pelayanan PATEN** | `GET /admin/pelayanan/permohonan/read`, `POST .../create`, `PUT .../update/{id}`, `PATCH .../{id}/status`, `POST .../{id}/documents`, `GET .../{id}/draft-pdf`, `GET /admin/pelayanan/dokumen/{doc_id}/download` | Dokumen pemohon privat; endpoint download memvalidasi RBAC & menulis `audit_logs` |
| **Persuratan** | `/admin/persuratan/surat-masuk/{read\|create\|update/{id}\|{id}/dispositions}`, `/admin/persuratan/surat-keluar/{read\|create\|update/{id}\|next-number}` | Penomoran otomatis berbasis kode klasifikasi surat |
| **Pemantauan & Ekspor** | `GET /admin/pemantauan/summary`, `GET .../completeness`, `GET .../timeliness`, `GET .../sla`, `GET .../export/{xlsx\|pdf}` | Filter berjenjang `district_id`, `village_id`, `period_year`, `period_quarter` |
| **Sistem** | `/admin/sistem/pengguna/{read\|create\|update/{id}\|delete/{id}}`, `GET /admin/sistem/audit-log/read`, `GET /admin/sistem/pencadangan/read`, `POST /admin/sistem/pencadangan/trigger` | Akses khusus Admin Kecamatan / Superadmin Kab. sesuai matriks RBAC |

### 8.4 Ringkasan Skema Payload & Response Entitas Utama

```json
// 1. UserProfile (/auth/me & /auth/login -> data.user)
{
  "id": "uuid",
  "username": "op_torobulu",
  "full_name": "Operator Desa Torobulu",
  "email": "torobulu@laeya.konaweselatankab.go.id",
  "role": "operator_desa",
  "district_id": "uuid-laeya",
  "district_name": "Laeya",
  "village_id": "uuid-torobulu",
  "village_name": "Torobulu",
  "is_active": true
}

// 2. DistrictItem & VillageItem (Master Wilayah)
{
  "id": "uuid-laeya",
  "code": "740511",
  "name": "Laeya",
  "slug": "laeya",
  "office_address": "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku",
  "service_hours": "Senin–Jumat, 08.00–16.00 WITA",
  "latitude": -4.2738,
  "longitude": 122.4664,
  "is_active": true,
  "is_default": true
}
// VillageItem menambahkan: "district_id", "type": "desa" | "kelurahan", "area_km2", "population_summary"

// 3. QuarterlyReportItem (Pelaporan Triwulanan)
{
  "id": "uuid",
  "district_id": "uuid-laeya",
  "village_id": "uuid-torobulu",
  "village_name": "Torobulu",
  "report_type_id": "uuid-type",
  "report_type_name": "Laporan Penyelenggaraan Pemerintahan Desa",
  "period_id": "uuid-period",
  "period_year": 2026,
  "period_quarter": 4,
  "status": "diajukan",
  "submission_version": 1,
  "submitted_at": "2026-11-20T09:15:00Z",
  "revision_note": null,
  "summary_payload": { "realisasi_anggaran_persen": 82.5, "jumlah_penduduk": 1840 },
  "attachments": [
    { "id": "uuid-att", "file_name": "lppd_tw4.pdf", "file_size": 524288, "sha256_hash": "..." }
  ],
  "created_by": "uuid-user",
  "updated_by": "uuid-user",
  "verified_by": null,
  "created_at": "2026-11-18T08:00:00Z",
  "updated_at": "2026-11-20T09:15:00Z",
  "verified_at": null
}

// 4. ServiceRequestItem (Pelayanan PATEN Admin) & PublicServiceTrackResponse (Publik)
{
  "id": "uuid",
  "registration_number": "PATEN-740511-2026-0042",
  "district_id": "uuid-laeya",
  "village_id": "uuid-puunggaluku",
  "service_type_id": "uuid-nikah",
  "service_type_name": "Rekomendasi / Dispensasi Nikah",
  "applicant_name": "Ahmad Saputra",
  "applicant_nik_masked": "740511******0003",
  "status": "diproses",
  "sla_due_at": "2026-11-26T16:00:00Z",
  "notes": "Berkas pengantar kelurahan lengkap",
  "documents": [
    { "id": "uuid-doc", "doc_label": "KTP Pemohon", "mime_type": "application/pdf", "is_private": true }
  ],
  "created_by": "uuid-petugas",
  "updated_at": "2026-11-23T10:30:00Z"
}
// PublicServiceTrackResponse (/publish/services/track/{registration_number}):
// Hanya mengembalikan registration_number, service_type_name, district_name, village_name,
// applicant_name_masked ("A*** S***"), status, sla_due_at, updated_at, & timeline status ringkas.
```

### 8.5 Strategi Transisi Mock → Live Backend
1. Selama fase *Frontend-First*, variabel `NEXT_PUBLIC_API_MODE=mock` mengaktifkan `frontend/lib/mock/` yang menyediakan data realistis 25 kecamatan Konsel, 17 desa/kelurahan Kec. Laeya, simulasi akun per role RBAC, persistensi lokal sementara, serta validasi transisi status sesuai kontrak di atas.
2. Pada awal Tahap 1, spesifikasi detail per-field dan contoh payload tiap modul dibukukan ke dokumen khusus **`API_CONTRACT.md`** (seperti `API_CONTRACT_ADMIN.md` di `edusetara`) sebagai referensi tunggal saat membangun backend FastAPI.
3. Ketika backend selesai, pergantian ke data real MySQL (`sippakades`) cukup dilakukan dengan mengubah `NEXT_PUBLIC_API_MODE=live` tanpa mengubah komponen UI ataupun *hooks* TanStack Query.

---

## 9. Tahapan Pengembangan (Roadmap Frontend-First → Backend & Integrasi)

- **Tahap 1 — Penguncian Kontrak Data (`API_CONTRACT.md`) & Fondasi Frontend (`frontend/`):**
  - Finalisasi `API_CONTRACT.md` dan `frontend/types/global.ts` mengacu pada Bagian 8.
  - Setup `frontend/` (Next.js App Router, TypeScript strict, Tailwind CSS v4, TanStack Query v5, Zustand v5 [`useAuthStore`, `useUrlStore`, `useFilterStore`, `useThemeStore`], Framer Motion, Three.js / R3F, Leaflet + OSM, SweetAlert2) beserta aset resmi `.webp` (`logo-konsel.webp`, `camat-laeya.webp`) di `frontend/public/img/`.
  - Bangun `lib/api.ts`, `lib/api_secure.ts`, dan lapisan `lib/mock/` (`NEXT_PUBLIC_API_MODE=mock`) berisi data simulasi 25 kecamatan Kab. Konawe Selatan & 17 desa/kelurahan Kec. Laeya serta akun simulasi multi-role.
- **Tahap 2 — Frontend Publik `(publish)` & Halaman Login `(auth)`:**
  - Implementasi tema cerah *soft sky blue* & *soft yellow*, *glassmorphism*, Hero 3D WebGL (optimasi `ssr: false`, `dpr={[1, 1.5]}`, `prefers-reduced-motion`, & *fallback*), identitas logo `logo-konsel.webp`, pemilih kecamatan dinamis (default: Kecamatan Laeya), serta seksi Sambutan Camat (`camat-laeya.webp`).
  - Bangun seluruh halaman publik: `/pemerintahan`, `/desa-kelurahan`, `/potensi-wilayah`, `/destinasi-wisata`, `/lokasi` (peta Leaflet), `/layanan` (syarat + lacak nomor registrasi *masked*), dan halaman login `/login`.
- **Tahap 3 — Frontend Dashboard Admin `(admin)` + Light/Dark Mode (Seluruh Modul):**
  - Bangun layout `(admin)`, sidebar berbasis role (`_data/admin-menu.ts`), **tombol Light/Dark mode (`admin-theme-toggle.tsx`)**, serta komponen UI bersama (`_components/ui/`).
  - Implementasikan seluruh halaman modul mengikuti pola 4 file `edusetara` (`page.tsx`, `types.ts`, `hooks/crud.tsx`, `components/`): Master Data (9 modul dengan *golden pattern* `Master Kecamatan → Master Desa/Kelurahan`), Pemerintahan & Publikasi, Pelaporan Triwulanan & Verifikasi, Pelayanan PATEN, Persuratan & Disposisi, Pemantauan 3 pilar + Ekspor, serta Sistem (Pengguna, Audit Log, Pencadangan).
  - Review penuh UI/UX (Light & Dark mode, responsivitas mobile/desktop, alur filter & status) dan verifikasi `eslint` / `tsc` / `next build` sebelum masuk ke pembangunan backend.
- **Tahap 4 — Fondasi Backend FastAPI, MySQL Lokal (`sippakades`) & Modul Auth/Master:**
  - Siapkan database MySQL lokal `sippakades` (`127.0.0.1:3306`, konfigurasi lokal di `backend/.env` yang di-ignore git; placeholder di `backend/.env.example`).
  - Setup `backend/` (`main.py`, `pyproject.toml`, FastAPI, SQLAlchemy async + `asyncmy`, Alembic, `app/core/` [Argon2id, PyJWT, HttpOnly cookie, `refresh_sessions`, CSRF, rate limit], `CRUDBase`, dan `upload_service.py` dengan konversi otomatis gambar publik ke `.webp` + storage privat `SHA-256`).
  - Buat migrasi awal + `seed_master.py` (25 kecamatan Kab. Konawe Selatan, 17 desa/kelurahan Kec. Laeya, Camat Ansar + `camat-laeya.webp`, role RBAC, dan seluruh data master) lalu implementasikan endpoint Auth, Users, dan 9 modul Master sesuai `API_CONTRACT.md`.
- **Tahap 5 — Backend Modul Operasional, Persuratan, Pemantauan & Ekspor:**
  - Implementasi endpoint publik `/api/v1/publish/*`, Pemerintahan & Publikasi, mesin workflow Pelaporan Triwulanan (penguncian draf, revisi, riwayat status), Pelayanan PATEN (dokumen privat terotorisasi, lacak publik *masked*, cetak draf PDF), Persuratan & Disposisi, Pemantauan 3 pilar, ekspor Excel (`openpyxl`) & PDF, serta `audit_logs` dan skrip `backend/scripts/backup_db.sh` + `backup_logs`.
- **Tahap 6 — Integrasi Live (`NEXT_PUBLIC_API_MODE=live`), Pengujian & Dokumentasi:**
  - Hubungkan Frontend ke Backend FastAPI live (`NEXT_PUBLIC_API_MODE=live`) dan verifikasi penuh seluruh alur end-to-end (Auth/CSRF/refresh cookie, CRUD, upload WebP & dokumen privat, workflow laporan/layanan, ekspor).
  - Jalankan pengujian menyeluruh: `pytest` (termasuk **uji isolasi RBAC antar-kecamatan `district_id`, antar-desa `village_id`, & dokumen privat**), `ruff check`, lint/typecheck/`next build` frontend, uji performa WebGL di mobile, verifikasi backup/restore MySQL, serta penyusunan `README.md` dan panduan menambah modul baru *(plus opsi integrasi Celery + Redis bila diperlukan pada tahap lanjut)*.
