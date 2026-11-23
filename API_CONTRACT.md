# Single Source of Truth (SSOT) Kontrak API — SIP-PAKADES
**Sistem Informasi Pemerintahan & Pelayanan Administrasi Kecamatan dan Desa**  
**Kabusip-pakades Konawe Selatan (Kecamatan Pilot: Laeya)**

> [!IMPORTANT]
> Dokumen ini merupakan **Single Source of Truth (SSOT)** kontrak data antara **Frontend (`frontend/`)** dan **Backend FastAPI (`backend/`)** sesuai [planning.md](file:///Users/dinaskominfo/kiken/Project/project/sip-pakades/planning.md) serta disiplin arsitektur referensi `edusetara`.  
> Selama fase **Frontend-First (`NEXT_PUBLIC_API_MODE=mock`)**, lapisan `frontend/lib/mock/` **wajib** mematuhi kontrak ini 100%, sehingga peralihan ke Backend FastAPI + MySQL lokal (`sippakades`, `NEXT_PUBLIC_API_MODE=live`) dapat berjalan mulus tanpa mengubah komponen UI atau *hooks* TanStack Query.

---

## 1. Prinsip Umum, Envelope Respons, Paginasi, Error & Scoping RBAC

### 1.1 Konvensi Dasar Protokol
- **Base Prefix:** `/api/v1` (contoh: `http://localhost:8000/api/v1/...`).
- **Format Data & Encoding:** JSON `UTF-8` (`application/json`), kecuali unggah berkas (`multipart/form-data`) dan unduhan biner (`.xlsx`, `.pdf`, atau dokumen privat pemohon).
- **Primary Key (`id`):** Seluruh entitas memakai UUID v4 (`string`, 36 karakter).
- **Format Waktu & Tanggal:**
  - Timestamp lengkap: **ISO-8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`, contoh: `2026-11-23T12:30:00Z`).
  - Tanggal tanpa jam: `YYYY-MM-DD` (contoh: `2026-11-23`).
- **Autentikasi & CSRF (`credentials: "include"`):**
  - Token sesi (`access_token`, `refresh_token`) disimpan pada **HttpOnly Cookie**.
  - Cookie non-HttpOnly `csrf_token` dibaca oleh `frontend/lib/api_secure.ts` dan dikirim ulang otomatis pada header **`X-CSRF-Token`** untuk seluruh metode mutasi (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Saat menerima HTTP `401`, `api_secure.ts` menjalankan mekanisme *single-flight* `POST /api/v1/auth/refresh` sebelum mengulang permintaan.

### 1.2 Empat Pola Respons Baku

#### A. `ApiEnvelope<T>` (Auth, Detail, Create, Update, Delete, Workflow Action)
```json
{
  "success": true,
  "message": "Data berhasil disimpan",
  "data": {}
}
```
*(Catatan: pada operasi `DELETE`, `data` dapat berisi `{"id": "uuid"}` atau `null`.)*

#### B. `PaginatedResponse<T>` (Seluruh Endpoint Daftar `/read`)
```json
{
  "total": 45,
  "skip": 0,
  "limit": 10,
  "data": []
}
```
- Konversi paginasi di Frontend: `skip = (page - 1) * limit` (default `limit = 10`, maksimum backend `limit = 100`).
- **Query Parameter Standar (`/read`):**
  `skip`, `limit`, `search` *(debounced 350ms)*, `district_id`, `village_id`, `period_year`, `period_quarter`, `type_id`, `category_id`, `status`, `is_active`, `sort_by`, `sort_dir` (`asc` | `desc`).

#### C. `OptionItem[]` (Seluruh Endpoint Dropdown `/option`)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "label": "Laeya",
    "code": "740511",
    "meta": {
      "slug": "laeya",
      "is_default": true
    }
  }
]
```

#### D. `ErrorResponse` (HTTP `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)
```json
{
  "success": false,
  "message": "Desa/Kelurahan wajib dipilih untuk operator desa",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "village_id", "message": "Field village_id tidak boleh kosong" }
  ]
}
```

### 1.3 Field Otomatis Backend (Dilarang Dipercaya dari Input Klien)
Field berikut dihasilkan atau diinjeksi otomatis oleh backend dari sesi login, generator nomor, atau penyimpanan berkas:
- `id`, `created_by`, `created_by_name`, `updated_by`, `updated_by_name`, `verified_by`, `verified_by_name`
- `created_at`, `updated_at`, `verified_at`, `submitted_at`, `submission_version`
- `sha256_hash`, `registration_number`, `sla_due_at`, `letter_number`

### 1.4 Penegakan Scope Multi-Kecamatan & Multi-Desa (RBAC Backend)
Setiap endpoint `/api/v1/admin/*` menegakkan pembatasan cakupan di `backend/app/api/deps.py`:
- **`superadmin_kab`:** Akses lintas seluruh kecamatan (`district_id` dan `village_id` opsional sebagai filter).
- **`admin_kecamatan`, `camat_sekcam`, `kasi_pelayanan`:** Terkunci ketat pada `district_id` milik akun yang login. Permintaan dengan `district_id` milik kecamatan lain atau mengakses resource kecamatan lain wajib ditolak dengan **`403 FORBIDDEN`**.
- **`operator_desa`:** Terkunci ketat pada `district_id` dan `village_id` milik desanya sendiri. Upaya menulis atau membaca data privat milik desa lain wajib ditolak dengan **`403 FORBIDDEN`**.

---

## 2. Kamus Enum Baku Terkunci

| Nama Enum | Nilai Valid (Exact String) | Keterangan Penggunaan |
| :--- | :--- | :--- |
| `RoleCode` | `superadmin_kab`, `admin_kecamatan`, `camat_sekcam`, `kasi_pelayanan`, `operator_desa` | Hak akses peran RBAC |
| `VillageType` | `desa`, `kelurahan` | Jenis wilayah di bawah kecamatan |
| `OfficialLevel` | `kecamatan`, `desa` | Tingkatan jabatan & perangkat |
| `ReportStatus` | `draf`, `diajukan`, `perlu_perbaikan`, `terverifikasi` | Siklus laporan rutin triwulanan |
| `ServiceStatus` | `diterima`, `perlu_kelengkapan`, `diproses`, `selesai` | Siklus pelayanan administrasi SIP-PAKADES |
| `LetterDirection` | `masuk`, `keluar` | Arah tata naskah persuratan |
| `DispositionStatus` | `baru`, `didisposisikan`, `ditindaklanjuti`, `selesai` | Status disposisi surat masuk |
| `TimelinessStatus` | `tepat_waktu`, `terlambat`, `perlu_perbaikan`, `belum_lapor` | Indikator ketepatan waktu laporan |
| `PublicationStatus` | `draf`, `terbit`, `arsip` | Status berita/pengumuman & regulasi |
| `AuditAction` | `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `DOWNLOAD_PRIVATE_DOC`, `EXPORT`, `BACKUP` | Jejak audit `audit_logs` |
| `ErrorCode` | `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATUS_TRANSITION`, `LOCKED_RESOURCE`, `RATE_LIMITED`, `FILE_VALIDATION_ERROR`, `INTERNAL_ERROR` | Kode kesalahan standar API |

---

## 3. Kontrak Autentikasi & Sesi (`/api/v1/auth/*`)

### 3.1 Daftar Endpoint Auth
| Method | Endpoint | Auth | Request Payload | Response `data` |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/auth/login` | Publik *(rate-limit)* | `{ "username": string, "password": string }` | `AuthSessionData` + set HttpOnly cookies & `csrf_token` |
| `GET` | `/auth/me` | Cookie | — | `AuthSessionData` |
| `POST` | `/auth/refresh` | Refresh Cookie | — | `{ "csrf_token": string, "user": UserProfile }` |
| `POST` | `/auth/logout` | Cookie + CSRF | — | `null` (hapus cookies & cabut refresh session saat ini) |
| `POST` | `/auth/logout-all` | Cookie + CSRF | — | `null` (cabut seluruh `refresh_sessions` milik user) |

### 3.2 Skema `UserProfile` & `AuthSessionData`
```json
{
  "success": true,
  "message": "Autentikasi berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "username": "camat_laeya",
      "full_name": "Ansar",
      "email": "camat.laeya@konaweselatankab.go.id",
      "phone": "0812xxxxxxxx",
      "nip": "197805142005011008",
      "role": "camat_sekcam",
      "role_label": "Camat / Sekcam",
      "district_id": "550e8400-e29b-41d4-a716-446655440011",
      "district_name": "Laeya",
      "village_id": null,
      "village_name": null,
      "avatar_url": "/img/camat-laeya.webp",
      "is_active": true,
      "last_login_at": "2026-11-23T12:15:00Z",
      "created_at": "2026-11-01T08:00:00Z"
    },
    "csrf_token": "random-csrf-token-string",
    "menus": [
      {
        "code": "dashboard",
        "label": "Dashboard",
        "path": "/admin",
        "icon": "layout-dashboard",
        "children": []
      }
    ]
  }
}
```

---

## 4. Kontrak Portal Publik `(publish)` (`/api/v1/publish/*`)

> [!NOTE]
> Seluruh endpoint `/api/v1/publish/*` bersifat **read-only** tanpa cookie autentikasi dan **dilarang keras** mengembalikan NIK utuh, nomor HP pribadi pemohon, atau URL berkas pribadi pemohon.

| Method | Endpoint | Parameter Query / Path | Deskripsi & Bentuk Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/publish/districts` | `?active_only=true` | `ApiEnvelope<PublicDistrictSummary[]>` — Daftar kecamatan aktif (memuat `id`, `code`, `name`, `slug`, `is_default`, `village_count`) untuk *District Switcher*. |
| `GET` | `/publish/districts/{slug}/overview` | `slug` *(default: `laeya`)* | `ApiEnvelope<PublicDistrictOverview>` — Profil kecamatan aktif, `logo_url` (`/img/logo-konsel.webp`), seksi `leader` (`full_name`, `position_name`, `photo_url: "/img/camat-laeya.webp"`, `welcome_message`), `vision`, `mission`, `office_address`, `service_hours`, `phone`, `email`, `latitude`, `longitude`, `stats` (`total_villages`, `total_officials`, `total_potentials`, `total_tourism`, `total_services_completed`), dan `org_structure[]`. |
| `GET` | `/publish/districts/{slug}/villages` | `?search=&type=&skip=0&limit=50` | `PaginatedResponse<PublicVillageCard>` — Direktori desa/kelurahan pada kecamatan `{slug}`. |
| `GET` | `/publish/districts/{slug}/villages/{village_id}` | `village_id` | `ApiEnvelope<PublicVillageDetail>` — Detail profil desa (sejarah, batas wilayah, luas, demografi, dusun/RW/RT, koordinat) + `officials[]` aktif + ringkasan potensi & wisata. |
| `GET` | `/publish/districts/{slug}/potentials` | `?category_id=&village_id=&search=&skip=0&limit=20` | `ApiEnvelope<{ items: PublicPotentialItem[], total: number, chart_summary: Array<{ category_name: string, count: number, total_value: number, unit: string }> }>` |
| `GET` | `/publish/districts/{slug}/tourism` | `?category_id=&village_id=&search=&skip=0&limit=12` | `PaginatedResponse<PublicTourismItem>` — Katalog destinasi wisata (cover & galeri `.webp`). |
| `GET` | `/publish/districts/{slug}/tourism/{id}` | `id` | `ApiEnvelope<PublicTourismDetail>` — Detail wisata, fasilitas, jam buka, galeri `.webp`, koordinat peta. |
| `GET` | `/publish/districts/{slug}/announcements` | `?type=&search=&skip=0&limit=9` | `PaginatedResponse<PublicAnnouncementItem>` — Hanya berita/pengumuman berstatus `terbit`. |
| `GET` | `/publish/districts/{slug}/announcements/{announcement_slug}` | `announcement_slug` | `ApiEnvelope<PublicAnnouncementDetail>` — Konten lengkap berita/pengumuman. |
| `GET` | `/publish/districts/{slug}/regulations` | `?search=&category=&skip=0&limit=20` | `PaginatedResponse<PublicRegulationItem>` — Dokumen Perdes/SK/SOP publik beserta `file_url` PDF publik. |
| `GET` | `/publish/services/types` | `?district_slug=laeya` | `ApiEnvelope<PublicServiceTypeItem[]>` — Daftar layanan SIP-PAKADES, daftar syarat (`requirements[]`), dan estimasi `sla_days`. |
| `GET` | `/publish/services/track/{registration_number}` | `registration_number` *(rate-limited)* | `ApiEnvelope<PublicServiceTrackResponse>` — Pelacakan progres non-sensitif berdasarkan nomor registrasi. |

### Contoh Response `GET /api/v1/publish/services/track/{registration_number}`
```json
{
  "success": true,
  "message": "Status permohonan ditemukan",
  "data": {
    "registration_number": "SIP-740511-2026-0042",
    "district_name": "Laeya",
    "village_name": "Puunggaluku",
    "service_type_name": "Rekomendasi / Dispensasi Nikah",
    "applicant_name_masked": "A*** S***",
    "status": "diproses",
    "sla_days": 3,
    "sla_due_at": "2026-11-26T16:00:00Z",
    "submitted_at": "2026-11-23T09:00:00Z",
    "updated_at": "2026-11-23T11:15:00Z",
    "timeline": [
      {
        "status": "diterima",
        "public_note": "Permohonan didaftarkan dengan pengantar kelurahan",
        "changed_at": "2026-11-23T09:00:00Z"
      },
      {
        "status": "diproses",
        "public_note": "Berkas lengkap, sedang dalam proses penandatanganan Camat",
        "changed_at": "2026-11-23T11:15:00Z"
      }
    ]
  }
}
```

---

## 5. Kontrak Modul Data Master Admin (`/api/v1/admin/master/*`) — 9 Modul

Seluruh modul Master mengikuti pola endpoint seragam:
- `GET /read` → `PaginatedResponse<T>`
- `GET /option` → `OptionItem[]` *(khusus `/desa/option` & `/desa/read` mendukung filter wajib/opsional `?district_id=...`)*
- `GET /detail/{id}` → `ApiEnvelope<T>`
- `POST /create` → `ApiEnvelope<T>` *(HTTP 201)*
- `PUT /update/{id}` → `ApiEnvelope<T>`
- `DELETE /delete/{id}` → `ApiEnvelope<{ id: string }>` *(mengembalikan `409 CONFLICT` jika masih direferensikan data operasional)*

| # | Modul & Endpoint Prefix | Tabel DB | Role Kelola | Field Input Request (`Create`/`Update`) & Aturan Unik |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `/admin/master/kecamatan` | `master_districts` | `superadmin_kab` | `code` *(unik)*, `name`, `slug` *(unik)*, `office_address`, `phone`, `email`, `service_hours`, `vision`, `mission`, `latitude`, `longitude`, `is_active`, `is_default` *(hanya 1 bernilai `true`)* |
| 2 | `/admin/master/desa` | `master_villages` | `superadmin_kab`, `admin_kecamatan` *(di `district_id`-nya)* | `district_id`, `code` *(unik)*, `name`, `slug`, `type` (`VillageType`), `description`, `history`, `boundaries` (`{ north, south, east, west }`), `area_km2`, `dusun_count`, `rw_count`, `rt_count`, `population_total`, `household_total`, `latitude`, `longitude`, `is_active` |
| 3 | `/admin/master/jabatan` | `master_official_positions` | `superadmin_kab` | `code` *(unik)*, `name`, `level` (`OfficialLevel`), `sort_order` *(int)*, `is_leadership` *(bool)*, `is_active` |
| 4 | `/admin/master/kategori-potensi` | `master_potential_categories` | `superadmin_kab` | `code` *(unik)*, `name`, `default_unit` *(mis. `Ton/Tahun`, `Ha`, `Unit`)*, `icon`, `description`, `is_active` |
| 5 | `/admin/master/kategori-wisata` | `master_tourism_categories` | `superadmin_kab` | `code` *(unik)*, `name`, `icon`, `description`, `is_active` |
| 6 | `/admin/master/jenis-laporan` | `master_report_types` | `superadmin_kab`, `admin_kecamatan` | `code` *(unik)*, `name`, `description`, `summary_schema` *(`Array<{ key, label, type: "number" \| "text", unit?, required }>`) *, `required_attachments` *(`string[]`)*, `is_active` |
| 7 | `/admin/master/periode-laporan` | `report_periods` | `superadmin_kab`, `admin_kecamatan` | `district_id` *(nullable untuk global kab.)*, `period_year` *(int)*, `period_quarter` (`1\|2\|3\|4`), `label` *(mis. `TW IV 2026`)*, `start_date`, `end_date`, `deadline_at`, `is_open` *(unik per `district_id + period_year + period_quarter`)* |
| 8 | `/admin/master/jenis-layanan` | `master_service_types` | `superadmin_kab`, `admin_kecamatan` | `code` *(unik)*, `name`, `description`, `sla_days` *(int >= 1)*, `requirements` *(`Array<{ code, label, required }>`) *, `letter_classification_id`, `template_code`, `is_active` |
| 9 | `/admin/master/klasifikasi-surat` | `master_letter_classifications` | `superadmin_kab`, `admin_kecamatan` | `code` *(unik, mis. `140`, `400`, `500`, `800`)*, `name`, `description`, `is_active` |

*(Response setiap item Master turut menyertakan field otomatis: `id`, `created_by`, `updated_by`, `created_at`, `updated_at`.)*

---

## 6. Kontrak Modul Pemerintahan & Publikasi (`/api/v1/admin/pemerintahan/*` & `/api/v1/admin/publikasi/*`)

### 6.1 Modul Pemerintahan
| Fitur & Prefix Endpoint | Endpoint & Operasi | Field Inti & Aturan Scope |
| :--- | :--- | :--- |
| **Profil Wilayah**<br>`/admin/pemerintahan/profil-wilayah` | `GET /district/{id}`, `PUT /district/{id}`, `GET /village/{id}`, `PUT /village/{id}` | Memperbarui profil wilayah (visi-misi, sejarah, jam layanan, alamat, batas, demografi, koordinat). `operator_desa` hanya dapat mengubah `/village/{id}` miliknya sendiri. |
| **Perangkat Pemerintahan**<br>`/admin/pemerintahan/perangkat` | `GET /read`, `GET /detail/{id}`, `POST /create`, `PUT /update/{id}`, `DELETE /delete/{id}`, `POST /{id}/photo` *(multipart → WebP)* | `district_id`, `village_id` *(`NULL` untuk perangkat level kecamatan)*, `position_id`, `position_name`, `full_name`, `nip`, `sk_number`, `term_start`, `term_end`, `phone`, `photo_url` *(`.webp`)*, `is_active`, `welcome_message` *(khusus pimpinan kecamatan)*. |
| **Potensi Wilayah**<br>`/admin/pemerintahan/potensi` | `GET /read`, `GET /detail/{id}`, `POST /create`, `PUT /update/{id}`, `DELETE /delete/{id}`, `POST /{id}/image` *(multipart → WebP)* | `district_id`, `village_id`, `category_id`, `title`, `description`, `metric_value` *(number)*, `metric_unit`, `period_year`, `image_url` *(`.webp`)*, `latitude`, `longitude`, `is_published`. |
| **Destinasi Wisata**<br>`/admin/pemerintahan/wisata` | `GET /read`, `GET /detail/{id}`, `POST /create`, `PUT /update/{id}`, `DELETE /delete/{id}`, `POST /{id}/images` *(multipart → WebP)* | `district_id`, `village_id`, `category_id`, `name`, `description`, `address`, `facilities` *(`string[]`)*, `opening_hours`, `ticket_info`, `cover_image_url` *(`.webp`)*, `gallery_urls` *(`string[]` `.webp`)*, `latitude`, `longitude`, `is_published`. |

### 6.2 Modul Publikasi
| Fitur & Prefix Endpoint | Endpoint & Operasi | Field Inti |
| :--- | :--- | :--- |
| **Berita & Pengumuman**<br>`/admin/publikasi/berita` | `GET /read`, `GET /detail/{id}`, `POST /create`, `PUT /update/{id}`, `DELETE /delete/{id}`, `POST /{id}/thumbnail` *(multipart → WebP)* | `district_id`, `village_id` *(nullable)*, `title`, `slug`, `category` (`berita` \| `pengumuman` \| `agenda`), `excerpt`, `content` *(HTML sanitasi / Tiptap)*, `thumbnail_url` *(`.webp`)*, `status` (`PublicationStatus`), `published_at`. |
| **Regulasi & Dokumen Publik**<br>`/admin/publikasi/regulasi` | `GET /read`, `GET /detail/{id}`, `POST /create`, `PUT /update/{id}`, `DELETE /delete/{id}`, `POST /{id}/file` *(multipart PDF publik)* | `district_id`, `village_id` *(nullable)*, `title`, `regulation_number`, `year`, `category` (`Perdes` \| `SK Camat` \| `SOP SIP-PAKADES` \| `Edaran`), `description`, `file_url` *(PDF publik)*, `file_size`, `sha256_hash`, `status` (`PublicationStatus`). |

---

## 7. Kontrak Modul Pelaporan Rutin Triwulanan (`/api/v1/admin/pelaporan/*`)

### 7.1 Daftar Endpoint Pelaporan (`/admin/pelaporan/triwulan/*`)
| Method | Endpoint | Role Berwenang | Deskripsi & Payload/Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/read` | Semua role internal | `PaginatedResponse<QuarterlyReportItem>` *(filter: `district_id`, `village_id`, `period_year`, `period_quarter`, `type_id`, `status`, `search`)* |
| `GET` | `/detail/{id}` | Semua role internal *(sesuai scope)* | `ApiEnvelope<QuarterlyReportDetail>` *(memuat `summary_payload`, `attachments[]`, `histories[]`)* |
| `POST` | `/create` | `operator_desa`, `admin_kecamatan`, `superadmin_kab` | Body: `{ district_id?, village_id?, report_type_id, period_id, title, summary_payload, notes? }` → Status awal wajib `draf`. Unik per `village_id + report_type_id + period_id` (`409 CONFLICT` jika duplikat). |
| `PUT` | `/update/{id}` | Pengisi (`operator_desa` wilayahnya) / `admin_kecamatan` | Hanya diizinkan jika status **`draf`** atau **`perlu_perbaikan`**. Jika status `diajukan` / `terverifikasi`, kembalikan **`409 LOCKED_RESOURCE`**. |
| `DELETE` | `/delete/{id}` | Pengisi / `admin_kecamatan` | Hanya diizinkan jika status masih **`draf`** (`409 LOCKED_RESOURCE` jika sudah pernah diajukan). |
| `POST` | `/{id}/attachments` | Pengisi / `admin_kecamatan` | `multipart/form-data` (`file`: PDF/XLSX, maks 10 MB, `doc_label`). Terkunci jika status `diajukan` / `terverifikasi`. Menghitung `sha256_hash`. |
| `DELETE` | `/{id}/attachments/{att_id}` | Pengisi / `admin_kecamatan` | Menghapus lampiran hanya saat status `draf` / `perlu_perbaikan`. |
| `GET` | `/{id}/attachments/{att_id}/download` | Role sesuai scope | Mengunduh file lampiran resmi laporan. |
| `POST` | `/{id}/submit` | `operator_desa` *(wilayahnya)*, `admin_kecamatan` | Mengajukan laporan ke antrean verifikasi Kecamatan (`draf` / `perlu_perbaikan` → `diajukan`). Backend memvalidasi kelengkapan `summary_payload` & lampiran wajib; bila tidak lengkap kembalikan `422 VALIDATION_ERROR`. Mengisi `submitted_at` & increment `submission_version`. |
| `POST` | `/{id}/verify` | `kasi_pelayanan`, `camat_sekcam`, `admin_kecamatan` | Body: `{ "decision": "terverifikasi" \| "perlu_perbaikan", "note": string }`. Jika `decision === "perlu_perbaikan"`, field `note` **wajib diisi**. Jika `terverifikasi`, isi `verified_by` & `verified_at` lalu kunci permanen. |
| `GET` | `/{id}/histories` | Role sesuai scope | `ApiEnvelope<ReportStatusHistoryItem[]>` (`from_status`, `to_status`, `note`, `changed_by_name`, `changed_at`, `submission_version`). |

### 7.2 State Machine & Aturan Penguncian Pelaporan
| Dari Status | Ke Status | Aksi / Endpoint | Syarat & Dampak Sistem |
| :--- | :--- | :--- | :--- |
| *(baru)* | `draf` | `POST /create` | Bebas edit & unggah lampiran; **tidak masuk** antrean verifikasi Kecamatan |
| `draf` | `diajukan` | `POST /{id}/submit` | Validasi syarat lengkap; kunci edit/hapus/lampiran; catat `submitted_at`, `submission_version = 1` |
| `diajukan` | `perlu_perbaikan` | `POST /{id}/verify` | Wajib isi `note`; membuka kembali kunci edit agar desa memperbaiki |
| `perlu_perbaikan` | `diajukan` | `POST /{id}/submit` | Kunci kembali data & lampiran; `submission_version += 1`; perbarui `submitted_at` |
| `diajukan` | `terverifikasi` | `POST /{id}/verify` | Kunci permanen; catat `verified_by` dan `verified_at` |

*(Setiap transisi di luar tabel di atas wajib ditolak dengan `400 INVALID_STATUS_TRANSITION`.)*

---

## 8. Kontrak Modul Pelayanan Administrasi SIP-PAKADES (`/api/v1/admin/pelayanan/*`)

### 8.1 Daftar Endpoint Pelayanan SIP-PAKADES
| Method | Endpoint | Role Berwenang | Deskripsi & Payload/Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/permohonan/read` | Semua role internal *(sesuai scope)* | `PaginatedResponse<ServiceRequestListItem>` — Di daftar, NIK tampil ter-*masking* (`applicant_nik_masked`). |
| `GET` | `/permohonan/detail/{id}` | Sesuai scope | `ApiEnvelope<ServiceRequestDetail>` — Menampilkan detail permohonan, daftar dokumen privat (`documents[]`), dan `histories[]`. |
| `POST` | `/permohonan/create` | `kasi_pelayanan`, `admin_kecamatan`, `operator_desa` *(untuk desanya)* | Body: `{ district_id?, village_id, service_type_id, applicant_name, applicant_nik, applicant_phone, applicant_address, village_cover_letter_no?, request_payload, notes? }`. Backend otomatis generate `registration_number` (`SIP-{KODE_KEC}-{TAHUN}-{URUT}`), `sla_due_at`, dan status awal `diterima`. |
| `PUT` | `/permohonan/update/{id}` | `kasi_pelayanan`, `admin_kecamatan`, `operator_desa` *(saat `diterima`/`perlu_kelengkapan`)* | Memperbarui data pemohon/isian sebelum `selesai`. |
| `PATCH` | `/permohonan/{id}/status` | `kasi_pelayanan`, `camat_sekcam`, `admin_kecamatan` | Body: `{ "status": ServiceStatus, "note": string, "public_note"?: string }`. Jika ke `perlu_kelengkapan`, `note` wajib diisi. Mencatat ke `service_status_histories`. |
| `GET` | `/permohonan/{id}/histories` | Sesuai scope | `ApiEnvelope<ServiceStatusHistoryItem[]>` |
| `POST` | `/permohonan/{id}/documents` | `kasi_pelayanan`, `admin_kecamatan`, `operator_desa` *(desanya)* | `multipart/form-data` (`file`: PDF/JPG/PNG maks 5 MB, `doc_code`, `doc_label`). Disimpan ke **storage privat** (nama UUID + `sha256_hash`, `is_private: true`). |
| `DELETE` | `/permohonan/{id}/documents/{doc_id}` | `kasi_pelayanan`, `admin_kecamatan`, `operator_desa` *(sebelum `diproses`/`selesai`)* | Menghapus dokumen syarat pemohon sebelum selesai. |
| `GET` | `/permohonan/{id}/draft-pdf` | `kasi_pelayanan`, `camat_sekcam`, `admin_kecamatan` | Mengunduh draf PDF surat rekomendasi/pengantar resmi kecamatan (`application/pdf`). |
| `GET` | `/dokumen/{doc_id}/download` | `kasi_pelayanan`, `camat_sekcam`, `admin_kecamatan` *(+ `operator_desa` khusus berkas desanya)* | Mengunduh file privat pemohon; **wajib** mencatat `DOWNLOAD_PRIVATE_DOC` ke `audit_logs`. |

### 8.2 State Machine Pelayanan SIP-PAKADES
- `diterima` → `perlu_kelengkapan` *(wajib `note` kekurangan berkas)* atau langsung `diproses`
- `perlu_kelengkapan` → `diproses` *(setelah berkas dilengkapi)*
- `diproses` → `selesai` *(mencatat `completed_at`, opsional terhubung ke `outgoing_letter_id`)*

---

## 9. Kontrak Modul Persuratan Kecamatan (`/api/v1/admin/persuratan/*`)

### 9.1 Surat Masuk & Disposisi (`/admin/persuratan/surat-masuk/*`)
| Method | Endpoint | Deskripsi & Field |
| :--- | :--- | :--- |
| `GET` | `/read` | `PaginatedResponse<IncomingLetterItem>` *(filter: `district_id`, `village_id`, `classification_id`, `disposition_status`, `date_from`, `date_to`, `search`)* |
| `GET` | `/detail/{id}` | `ApiEnvelope<IncomingLetterDetail>` *(termasuk `dispositions[]`)* |
| `POST` | `/create` | Body: `{ district_id?, source_village_id?, classification_id, agenda_number?, origin_letter_number, origin_sender, letter_date, received_date, subject, summary?, urgency: "biasa" \| "segera" \| "amat_segera" }` |
| `PUT` | `/update/{id}` | Memperbarui metadata surat masuk |
| `DELETE` | `/delete/{id}` | Menghapus surat masuk yang belum memiliki disposisi selesai |
| `POST` | `/{id}/scan` | `multipart/form-data` (`file`: PDF/JPG/PNG maks 10 MB) — arsip scan surat masuk |
| `POST` | `/{id}/dispositions` | *(Khusus `camat_sekcam`, `admin_kecamatan`)* Body: `{ "target_user_id": string, "instruction": string, "due_date"?: string }` → status disposisi otomatis `didisposisikan` |
| `PATCH` | `/{id}/dispositions/{disp_id}` | *(Oleh penerima disposisi `kasi_pelayanan` / `camat_sekcam`)* Body: `{ "status": "ditindaklanjuti" \| "selesai", "action_note": string }` |

### 9.2 Surat Keluar (`/admin/persuratan/surat-keluar/*`)
| Method | Endpoint | Deskripsi & Field |
| :--- | :--- | :--- |
| `GET` | `/read` | `PaginatedResponse<OutgoingLetterItem>` |
| `GET` | `/detail/{id}` | `ApiEnvelope<OutgoingLetterDetail>` |
| `GET` | `/next-number` | Query: `?district_id=&classification_id=&year=2026` → `ApiEnvelope<{ letter_number: string, sequence_number: number }>` *(contoh format: `140/042/KEC-LAEYA/XI/2026`)* |
| `POST` | `/create` | Body: `{ district_id?, target_village_id?, classification_id, service_request_id?, letter_type: "pengantar" \| "rekomendasi" \| "keterangan" \| "tugas" \| "undangan", recipient, letter_date, subject, summary?, auto_number: boolean, letter_number? }` |
| `PUT` | `/update/{id}` | Memperbarui metadata surat keluar |
| `DELETE` | `/delete/{id}` | Menghapus draf surat keluar |
| `POST` | `/{id}/scan` | `multipart/form-data` (`file`: PDF bertanda tangan, maks 10 MB) |

---

## 10. Kontrak Modul Pemantauan, Rekap Otomatis & Ekspor (`/api/v1/admin/pemantauan/*`)

| Method | Endpoint | Query Parameters | Struktur Response `data` |
| :--- | :--- | :--- | :--- |
| `GET` | `/summary` | `district_id`, `period_year`, `period_quarter` | `{ active_villages_count, avg_completeness_pct, reports_on_time_count, reports_late_count, reports_pending_count, services_total, services_completed, services_sla_compliance_pct, incoming_letters_count, outgoing_letters_count }` |
| `GET` | `/completeness` | `district_id`, `village_id`, `search`, `skip`, `limit` | `PaginatedResponse<{ village_id, village_name, village_type, has_profile: boolean, officials_count: number, potentials_count: number, tourism_count: number, completeness_pct: number, missing_items: string[] }>` |
| `GET` | `/timeliness` | `district_id`, `village_id`, `period_year`, `period_quarter`, `report_type_id`, `timeliness_status` | `PaginatedResponse<{ village_id, village_name, report_type_id, report_type_name, period_label, deadline_at, submitted_at, report_status, timeliness_status: TimelinessStatus, delay_days: number }>` |
| `GET` | `/sla` | `district_id`, `village_id`, `service_type_id`, `date_from`, `date_to` | `ApiEnvelope<{ by_service_type: Array<{ service_type_id, service_type_name, sla_days, total, completed, within_sla, avg_completion_days, sla_compliance_pct }>, status_distribution: Record<ServiceStatus, number> }>` |
| `GET` | `/export/xlsx` | `report_scope` (`completeness` \| `timeliness` \| `services_sla` \| `letters_agenda`), `district_id`, `village_id`, `period_year`, `period_quarter` | Binary download `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` + catat `EXPORT` ke `audit_logs` |
| `GET` | `/export/pdf` | Sama dengan `/export/xlsx` | Binary download `application/pdf` (kop resmi menggunakan `logo-konsel.webp`) + catat `EXPORT` ke `audit_logs` |

---

## 11. Kontrak Modul Sistem (`/api/v1/admin/sistem/*`)

| Sub-Modul & Endpoint | Role Berwenang | Deskripsi & Field Inti |
| :--- | :--- | :--- |
| **Pengguna** `/admin/sistem/pengguna/{read\|detail/{id}\|create\|update/{id}\|delete/{id}\|reset-password/{id}}` | `superadmin_kab`, `admin_kecamatan` *(hanya user di `district_id`-nya & tidak bisa membuat `superadmin_kab`)* | `username`, `full_name`, `email`, `phone`, `nip`, `role` (`RoleCode`), `district_id`, `village_id`, `is_active`, `password` *(hanya pada `create` / `reset-password`)* |
| **Audit Log** `GET /admin/sistem/audit-log/read` | `superadmin_kab`, `admin_kecamatan` *(di `district_id`-nya)*, `camat_sekcam` *(ringkas)* | Filter: `action` (`AuditAction`), `user_id`, `entity_type`, `date_from`, `date_to`, `search`. Mengembalikan `PaginatedResponse<AuditLogItem>` (`user_name`, `role`, `action`, `entity_type`, `entity_id`, `before_data`, `after_data`, `ip_address`, `created_at`). |
| **Pencadangan DB** `GET /admin/sistem/pencadangan/read`, `POST /admin/sistem/pencadangan/trigger` | `superadmin_kab` | Daftar `BackupLogItem` (`file_name`, `file_size_bytes`, `status`, `triggered_by_name`, `started_at`, `finished_at`, `notes`) dan pemicu manual eksekusi `backup_db.sh`. |

---

## 12. Standar Upload Media (WebP vs Privat) & Paritas Mode `mock` → `live`

### 12.1 Tabel Kebijakan Upload & Penyimpanan Berkas
| Jenis Berkas | Ekstensi & MIME Valid | Ukuran Maks | Konversi WebP | Penyimpanan & Akses |
| :--- | :--- | :---: | :---: | :--- |
| **Foto Perangkat, Potensi, Wisata, Thumbnail Berita** | `.jpg`, `.jpeg`, `.png`, `.webp` *(cek magic bytes)* | 5 MB | **Ya** *(otomatis via `Pillow`)* | Direktori publik `/media/public/...` (dapat diakses langsung oleh landing page) |
| **Dokumen Regulasi Publik & Scan Surat Dinas** | `.pdf`, `.jpg`, `.png` *(scan surat boleh gambar/PDF)* | 10 MB | Tidak *(PDF tetap asli)* | Regulasi: publik `/media/public/regulations/...`; Surat Dinas: privat terautentikasi |
| **Lampiran Laporan Triwulanan (`report_attachments`)** | `.pdf`, `.xlsx`, `.xls` | 10 MB | Tidak *(asli + `sha256_hash`)* | Direktori privat + endpoint `/admin/pelaporan/triwulan/{id}/attachments/{att_id}/download` |
| **Dokumen Pribadi Pemohon SIP-PAKADES (`service_documents`)** | `.pdf`, `.jpg`, `.jpeg`, `.png` | 5 MB | Tidak *(asli + nama UUID + `sha256_hash`)* | **Direktori privat non-publik**; hanya via `/admin/pelayanan/dokumen/{doc_id}/download` + wajib tulis `audit_logs` |

### 12.2 Akun Simulasi Standar Fase Frontend-First (`frontend/lib/mock/`)
Selama `NEXT_PUBLIC_API_MODE=mock`, halaman `/login` menyediakan pengisian cepat *(quick-fill)* untuk menguji seluruh tampilan & pembatasan menu berbasis RBAC:

| Username | Role (`RoleCode`) | Cakupan Wilayah | Tujuan Pengujian UI |
| :--- | :--- | :--- | :--- |
| `superadmin` | `superadmin_kab` | Lintas seluruh 25 Kecamatan | Kelola 9 Master Data Global, switch antar-kecamatan, pemantauan kabusip-pakades, backup DB |
| `admin_laeya` | `admin_kecamatan` | Kecamatan Laeya | Kelola user kec. Laeya, desa kec. Laeya, persuratan, berita/regulasi, pemantauan |
| `camat_laeya` | `camat_sekcam` | Kecamatan Laeya (`Ansar`) | Disposisi surat masuk, verifikasi akhir laporan triwulanan, dashboard pimpinan |
| `kasi_laeya` | `kasi_pelayanan` | Kecamatan Laeya | Loket SIP-PAKADES (3 layanan), akses unduh dokumen privat, tindak lanjut disposisi |
| `op_torobulu` | `operator_desa` | Desa Torobulu (Kec. Laeya) | Input profil/perangkat/potensi/wisata Desa Torobulu, lapor triwulanan & pengantar SIP-PAKADES |
| `op_puunggaluku` | `operator_desa` | Kel. Puunggaluku (Kec. Laeya) | Uji isolasi data antar-desa/kelurahan terhadap akun `op_torobulu` |

### 12.3 Aturan Paritas Transisi `mock` → `live`
1. Seluruh fungsi pada `frontend/lib/mock/handlers.ts` **wajib** mengembalikan tipe JSON, kode error, dan aturan validasi status yang identik dengan Bab 1–11 dokumen ini.
2. Komponen UI, `hooks/crud.tsx`, dan halaman Next.js **dilarang** mengakses `lib/mock/` secara langsung; seluruh komunikasi hanya melewati `lib/api.ts` dan `lib/api_secure.ts`.
3. Ketika Backend FastAPI (Tahap 4–5) selesai, pengujian integrasi Tahap 6 memverifikasi kesamaan setiap endpoint terhadap dokumen ini sambil mengalihkan `.env.local` frontend dari `NEXT_PUBLIC_API_MODE=mock` menjadi `NEXT_PUBLIC_API_MODE=live`.
