import {
  AuditAction,
  DispositionStatus,
  OfficialLevel,
  PublicationStatus,
  ReportStatus,
  RoleCode,
  ServiceStatus,
  TimelinessStatus,
} from "@/types/global";
import {
  DISTRICT_LAEYA_ID,
  VILLAGE_PUUNGGALUKU_ID,
  VILLAGE_TOROBULU_ID,
} from "./seed-data";

export interface SimpleMasterItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  // Optional extra fields for specific masters
  level?: OfficialLevel;
  sort_order?: number;
  is_leadership?: boolean;
  default_unit?: string;
  sla_days?: number;
  period_year?: number;
  period_quarter?: number;
  start_date?: string;
  end_date?: string;
  deadline_at?: string;
  is_open?: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficialItem {
  id: string;
  district_id: string;
  district_name?: string;
  village_id: string | null;
  village_name?: string | null;
  position_id: string;
  position_name: string;
  full_name: string;
  nip: string | null;
  sk_number: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface QuarterlyReportItem {
  id: string;
  district_id: string;
  village_id: string;
  village_name: string;
  report_type_id: string;
  report_type_name: string;
  period_id: string;
  period_year: number;
  period_quarter: number;
  period_label: string;
  title: string;
  status: ReportStatus;
  submission_version: number;
  submitted_at: string | null;
  revision_note: string | null;
  summary_payload: Record<string, string | number>;
  attachments: Array<{
    id: string;
    file_name: string;
    file_size: number;
    sha256_hash: string;
  }>;
  histories: Array<{
    from_status: string | null;
    to_status: ReportStatus;
    note: string;
    changed_by_name: string;
    changed_at: string;
    submission_version: number;
  }>;
  created_by_name: string;
  verified_by_name: string | null;
  updated_at: string;
}

export interface ServiceRequestItem {
  id: string;
  registration_number: string;
  district_id: string;
  village_id: string;
  village_name: string;
  service_type_id: string;
  service_type_name: string;
  applicant_name: string;
  applicant_nik_masked: string;
  applicant_phone: string;
  applicant_address: string;
  village_cover_letter_no: string | null;
  status: ServiceStatus;
  sla_days: number;
  sla_due_at: string;
  notes: string | null;
  documents: Array<{
    id: string;
    doc_code: string;
    doc_label: string;
    file_name: string;
    mime_type: string;
    is_private: boolean;
  }>;
  histories: Array<{
    status: ServiceStatus;
    note: string;
    public_note: string;
    changed_by_name: string;
    changed_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface IncomingLetterItem {
  id: string;
  district_id: string;
  source_village_id: string | null;
  source_village_name: string | null;
  classification_id: string;
  classification_code: string;
  agenda_number: string;
  origin_letter_number: string;
  origin_sender: string;
  letter_date: string;
  received_date: string;
  subject: string;
  urgency: "biasa" | "segera" | "amat_segera";
  disposition_status: DispositionStatus;
  dispositions: Array<{
    id: string;
    target_user_id: string;
    target_user_name: string;
    instruction: string;
    status: DispositionStatus;
    action_note: string | null;
    created_at: string;
  }>;
}

export interface OutgoingLetterItem {
  id: string;
  district_id: string;
  target_village_id: string | null;
  classification_id: string;
  classification_code: string;
  letter_number: string;
  letter_type: "pengantar" | "rekomendasi" | "keterangan" | "tugas" | "undangan";
  recipient: string;
  letter_date: string;
  subject: string;
  service_request_id: string | null;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  district_id: string | null;
  user_name: string;
  role: RoleCode;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  summary: string;
  ip_address: string;
  created_at: string;
}

export interface BackupLogItem {
  id: string;
  file_name: string;
  file_size_bytes: number;
  status: "success" | "failed";
  triggered_by_name: string;
  started_at: string;
  finished_at: string;
  notes: string;
}

const NOW = "2026-11-23T08:00:00Z";

export const INITIAL_MASTER_POSITIONS: SimpleMasterItem[] = [
  { id: "pos-camat", code: "CAMAT", name: "Camat", level: "kecamatan", sort_order: 1, is_leadership: true, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "pos-sekcam", code: "SEKCAM", name: "Sekretaris Camat", level: "kecamatan", sort_order: 2, is_leadership: false, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "pos-kasi", code: "KASI", name: "Kepala Seksi (Kasi)", level: "kecamatan", sort_order: 3, is_leadership: false, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "pos-kades", code: "KADES", name: "Kepala Desa / Lurah", level: "desa", sort_order: 1, is_leadership: true, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "pos-sekdes", code: "SEKDES", name: "Sekretaris Desa / Lurah", level: "desa", sort_order: 2, is_leadership: false, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "pos-kadus", code: "KADUS", name: "Kepala Dusun / Lingkungan", level: "desa", sort_order: 3, is_leadership: false, is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_POTENTIAL_CATEGORIES: SimpleMasterItem[] = [
  { id: "cat-pertanian", code: "PERTANIAN", name: "Pertanian Pangan", default_unit: "Ha", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cat-perkebunan", code: "PERKEBUNAN", name: "Perkebunan", default_unit: "Ha", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cat-perikanan", code: "PERIKANAN", name: "Perikanan & Kelautan", default_unit: "Ton/Tahun", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cat-peternakan", code: "PETERNAKAN", name: "Peternakan Rakyat", default_unit: "Ekor", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cat-umkm", code: "UMKM", name: "UMKM & Perdagangan", default_unit: "Unit Usaha", is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_TOURISM_CATEGORIES: SimpleMasterItem[] = [
  { id: "tcat-bahari", code: "BAHARI", name: "Wisata Bahari", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "tcat-alam", code: "ALAM", name: "Wisata Alam", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "tcat-eko", code: "EKOWISATA", name: "Ekowisata", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "tcat-budaya", code: "BUDAYA", name: "Wisata Budaya & Sejarah", is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_REPORT_TYPES: SimpleMasterItem[] = [
  { id: "rt-lppd", code: "LPPD-TW", name: "Laporan Penyelenggaraan Pemerintahan Desa/Kelurahan", description: "Rekap kegiatan pemerintahan, lembaga desa, & pelayanan warga triwulanan.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "rt-apbdes", code: "APBDES-TW", name: "Laporan Realisasi Keuangan / APBDes Triwulanan", description: "Ringkasan realisasi pendapatan, belanja, dan pembiayaan desa.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "rt-trantib", code: "TRANTIB-TW", name: "Laporan Kependudukan & Trantibum", description: "Data mutasi penduduk, kejadian keamanan, dan ketertiban umum.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "rt-aset", code: "PEMB-TW", name: "Laporan Pembangunan, Aset Desa & Potensi Wilayah", description: "Progres fisik pembangunan desa, inventaris aset, & pembaruan potensi.", is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_REPORT_PERIODS: SimpleMasterItem[] = [
  { id: "per-2026-1", code: "2026-TW1", name: "TW I 2026", period_year: 2026, period_quarter: 1, start_date: "2026-01-01", end_date: "2026-03-31", deadline_at: "2026-04-15T16:00:00Z", is_open: false, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "per-2026-2", code: "2026-TW2", name: "TW II 2026", period_year: 2026, period_quarter: 2, start_date: "2026-04-01", end_date: "2026-06-30", deadline_at: "2026-07-15T16:00:00Z", is_open: false, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "per-2026-3", code: "2026-TW3", name: "TW III 2026", period_year: 2026, period_quarter: 3, start_date: "2026-07-01", end_date: "2026-09-30", deadline_at: "2026-10-15T16:00:00Z", is_open: true, is_active: true, created_at: NOW, updated_at: NOW },
  { id: "per-2026-4", code: "2026-TW4", name: "TW IV 2026", period_year: 2026, period_quarter: 4, start_date: "2026-10-01", end_date: "2026-12-31", deadline_at: "2027-01-15T16:00:00Z", is_open: true, is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_SERVICE_TYPES_MASTER: SimpleMasterItem[] = [
  { id: "srv-nikah", code: "PATEN-NKH", name: "Rekomendasi / Dispensasi Nikah", sla_days: 2, description: "Pengantar & rekomendasi nikah ke KUA / dispensasi < 10 hari kerja.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "srv-iumk", code: "PATEN-IUMK", name: "Rekomendasi Izin Usaha Mikro & Kecil (IUMK)", sla_days: 3, description: "Surat keterangan dan rekomendasi izin usaha mikro/kecil.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "srv-kependudukan", code: "PATEN-ADK", name: "Pengantar Administrasi Kependudukan & Pertanahan", sla_days: 3, description: "Rekomendasi pindah datang, SKTM khusus, & register ahli waris.", is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_LETTER_CLASSIFICATIONS: SimpleMasterItem[] = [
  { id: "cls-140", code: "140", name: "Pemerintahan Desa / Kelurahan", description: "Klasifikasi naskah dinas penyelenggaraan pemerintahan desa/kelurahan.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cls-400", code: "400", name: "Kesejahteraan Rakyat", description: "Sosial, keagamaan, nikah, kesehatan, & pendidikan.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cls-500", code: "500", name: "Perekonomian & UMKM", description: "Izin usaha mikro (IUMK), pertanian, perikanan, & koperasi.", is_active: true, created_at: NOW, updated_at: NOW },
  { id: "cls-800", code: "800", name: "Kepegawaian & Perangkat", description: "Surat tugas, SK perangkat, dan administrasi kepegawaian.", is_active: true, created_at: NOW, updated_at: NOW },
];

export const INITIAL_OFFICIALS: OfficialItem[] = [
  {
    id: "off-1",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: null,
    village_name: "Kantor Kecamatan Laeya",
    position_id: "pos-camat",
    position_name: "Camat Laeya",
    full_name: "Ansar",
    nip: "197805142005011008",
    sk_number: "SK.821/104/2024",
    phone: "081242001001",
    photo_url: "/img/camat-laeya.webp",
    is_active: true,
    updated_at: NOW,
  },
  {
    id: "off-2",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: null,
    village_name: "Kantor Kecamatan Laeya",
    position_id: "pos-sekcam",
    position_name: "Sekretaris Camat",
    full_name: "Hendra Wijaya, S.Sos",
    nip: "198104112008011005",
    sk_number: "SK.821/108/2024",
    phone: "081242001002",
    photo_url: null,
    is_active: true,
    updated_at: NOW,
  },
  {
    id: "off-3",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: VILLAGE_PUUNGGALUKU_ID,
    village_name: "Kel. Puunggaluku",
    position_id: "pos-kades",
    position_name: "Lurah Puunggaluku",
    full_name: "Darwis, S.Sos",
    nip: "198309152010011011",
    sk_number: "SK.141/22/2025",
    phone: "081242001003",
    photo_url: null,
    is_active: true,
    updated_at: NOW,
  },
  {
    id: "off-4",
    district_id: DISTRICT_LAEYA_ID,
    district_name: "Laeya",
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Desa Torobulu",
    position_id: "pos-kades",
    position_name: "Kepala Desa Torobulu",
    full_name: "H. Syahrir",
    nip: null,
    sk_number: "SK.141/18/2023",
    phone: "081242001004",
    photo_url: null,
    is_active: true,
    updated_at: NOW,
  },
];

export const INITIAL_REPORTS: QuarterlyReportItem[] = [
  {
    id: "rep-1",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Desa Torobulu",
    report_type_id: "rt-lppd",
    report_type_name: "Laporan Penyelenggaraan Pemerintahan Desa/Kelurahan",
    period_id: "per-2026-3",
    period_year: 2026,
    period_quarter: 3,
    period_label: "TW III 2026",
    title: "LPPD Triwulan III 2026 Desa Torobulu",
    status: "terverifikasi",
    submission_version: 1,
    submitted_at: "2026-10-10T09:30:00Z",
    revision_note: null,
    summary_payload: { jumlah_kegiatan: 14, surat_keluar_desa: 96, rapat_bpd: 3 },
    attachments: [
      { id: "att-1", file_name: "lppd_torobulu_tw3_2026.pdf", file_size: 482300, sha256_hash: "e3b0c44298fc1c149afbf4c8996fb924" },
    ],
    histories: [
      { from_status: null, to_status: "draf", note: "Laporan dibuat", changed_by_name: "Operator Desa Torobulu", changed_at: "2026-10-08T08:00:00Z", submission_version: 1 },
      { from_status: "draf", to_status: "diajukan", note: "Diajukan ke Kecamatan Laeya", changed_by_name: "Operator Desa Torobulu", changed_at: "2026-10-10T09:30:00Z", submission_version: 1 },
      { from_status: "diajukan", to_status: "terverifikasi", note: "Data lengkap dan sesuai format", changed_by_name: "Ansar", changed_at: "2026-10-12T14:20:00Z", submission_version: 1 },
    ],
    created_by_name: "Operator Desa Torobulu",
    verified_by_name: "Ansar",
    updated_at: "2026-10-12T14:20:00Z",
  },
  {
    id: "rep-2",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_PUUNGGALUKU_ID,
    village_name: "Kel. Puunggaluku",
    report_type_id: "rt-apbdes",
    report_type_name: "Laporan Realisasi Keuangan / APBDes Triwulanan",
    period_id: "per-2026-4",
    period_year: 2026,
    period_quarter: 4,
    period_label: "TW IV 2026",
    title: "Realisasi Keuangan TW IV 2026 Kel. Puunggaluku",
    status: "diajukan",
    submission_version: 1,
    submitted_at: "2026-11-22T10:15:00Z",
    revision_note: null,
    summary_payload: { realisasi_persen: 84.5, pagu_anggaran: 450000000 },
    attachments: [
      { id: "att-2", file_name: "realisasi_puunggaluku_tw4.xlsx", file_size: 215400, sha256_hash: "8f434346648f6b96df89dda901c5176b" },
    ],
    histories: [
      { from_status: null, to_status: "draf", note: "Draf dibuat", changed_by_name: "Operator Kel. Puunggaluku", changed_at: "2026-11-20T09:00:00Z", submission_version: 1 },
      { from_status: "draf", to_status: "diajukan", note: "Menunggu verifikasi kecamatan", changed_by_name: "Operator Kel. Puunggaluku", changed_at: "2026-11-22T10:15:00Z", submission_version: 1 },
    ],
    created_by_name: "Operator Kel. Puunggaluku",
    verified_by_name: null,
    updated_at: "2026-11-22T10:15:00Z",
  },
  {
    id: "rep-3",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Desa Torobulu",
    report_type_id: "rt-trantib",
    report_type_name: "Laporan Kependudukan & Trantibum",
    period_id: "per-2026-4",
    period_year: 2026,
    period_quarter: 4,
    period_label: "TW IV 2026",
    title: "Laporan Kependudukan & Trantibum TW IV 2026",
    status: "perlu_perbaikan",
    submission_version: 1,
    submitted_at: "2026-11-18T11:00:00Z",
    revision_note: "Mohon lengkapi lampiran rekap mutasi penduduk pindah datang bulan November.",
    summary_payload: { penduduk_akhir: 2450, kelahiran: 12, pindah_datang: 8 },
    attachments: [],
    histories: [
      { from_status: null, to_status: "draf", note: "Draf dibuat", changed_by_name: "Operator Desa Torobulu", changed_at: "2026-11-17T08:30:00Z", submission_version: 1 },
      { from_status: "draf", to_status: "diajukan", note: "Diajukan", changed_by_name: "Operator Desa Torobulu", changed_at: "2026-11-18T11:00:00Z", submission_version: 1 },
      { from_status: "diajukan", to_status: "perlu_perbaikan", note: "Mohon lengkapi lampiran rekap mutasi penduduk pindah datang bulan November.", changed_by_name: "Kasi Pelayanan Kec. Laeya", changed_at: "2026-11-19T14:00:00Z", submission_version: 1 },
    ],
    created_by_name: "Operator Desa Torobulu",
    verified_by_name: null,
    updated_at: "2026-11-19T14:00:00Z",
  },
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequestItem[] = [
  {
    id: "sr-1",
    registration_number: "PATEN-740511-2026-0042",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_PUUNGGALUKU_ID,
    village_name: "Kel. Puunggaluku",
    service_type_id: "srv-nikah",
    service_type_name: "Rekomendasi / Dispensasi Nikah",
    applicant_name: "Ahmad Saputra",
    applicant_nik_masked: "740511******0003",
    applicant_phone: "085241110001",
    applicant_address: "Lingk. II Kel. Puunggaluku",
    village_cover_letter_no: "474.2/18/KEL-PGL/XI/2026",
    status: "diproses",
    sla_days: 2,
    sla_due_at: "2026-11-25T16:00:00Z",
    notes: "Berkas pengantar N1-N4 lengkap",
    documents: [
      { id: "doc-1", doc_code: "ktp_kk", doc_label: "KTP & KK Pemohon", file_name: "ktp_ahmad.pdf", mime_type: "application/pdf", is_private: true },
      { id: "doc-2", doc_code: "pengantar_desa", doc_label: "Pengantar N1-N4 Kelurahan", file_name: "n1_n4_puunggaluku.pdf", mime_type: "application/pdf", is_private: true },
    ],
    histories: [
      { status: "diterima", note: "Berkas diterima di loket PATEN", public_note: "Permohonan didaftarkan dengan pengantar kelurahan.", changed_by_name: "Kasi Pelayanan Kec. Laeya", changed_at: "2026-11-23T09:00:00Z" },
      { status: "diproses", note: "Naik meja Camat untuk penandatanganan", public_note: "Berkas lengkap, sedang proses tanda tangan Camat.", changed_by_name: "Kasi Pelayanan Kec. Laeya", changed_at: "2026-11-23T11:15:00Z" },
    ],
    created_at: "2026-11-23T09:00:00Z",
    updated_at: "2026-11-23T11:15:00Z",
  },
  {
    id: "sr-2",
    registration_number: "PATEN-740511-2026-0041",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Desa Torobulu",
    service_type_id: "srv-iumk",
    service_type_name: "Rekomendasi Izin Usaha Mikro & Kecil (IUMK)",
    applicant_name: "Hasnah Rahayu",
    applicant_nik_masked: "740511******0019",
    applicant_phone: "085241110002",
    applicant_address: "Dusun I Desa Torobulu",
    village_cover_letter_no: "500/09/DES-TRB/XI/2026",
    status: "selesai",
    sla_days: 3,
    sla_due_at: "2026-11-22T16:00:00Z",
    notes: "Usaha olahan ikan asap pesisir",
    documents: [
      { id: "doc-3", doc_code: "ktp_kk", doc_label: "KTP Pemohon", file_name: "ktp_hasnah.jpg", mime_type: "image/jpeg", is_private: true },
    ],
    histories: [
      { status: "diterima", note: "Diterima dari Operator Desa Torobulu", public_note: "Permohonan diterima dari Operator Desa Torobulu.", changed_by_name: "Operator Desa Torobulu", changed_at: "2026-11-19T10:20:00Z" },
      { status: "diproses", note: "Verifikasi usaha mikro", public_note: "Verifikasi usaha mikro oleh Kasi Pelayanan.", changed_by_name: "Kasi Pelayanan Kec. Laeya", changed_at: "2026-11-20T09:30:00Z" },
      { status: "selesai", note: "Rekomendasi IUMK terbit", public_note: "Surat Rekomendasi IUMK telah terbit.", changed_by_name: "Kasi Pelayanan Kec. Laeya", changed_at: "2026-11-21T14:00:00Z" },
    ],
    created_at: "2026-11-19T10:20:00Z",
    updated_at: "2026-11-21T14:00:00Z",
  },
];

export const INITIAL_INCOMING_LETTERS: IncomingLetterItem[] = [
  {
    id: "in-1",
    district_id: DISTRICT_LAEYA_ID,
    source_village_id: VILLAGE_TOROBULU_ID,
    source_village_name: "Desa Torobulu",
    classification_id: "cls-140",
    classification_code: "140",
    agenda_number: "AGD-2026-089",
    origin_letter_number: "140/21/DES-TRB/XI/2026",
    origin_sender: "Pemerintah Desa Torobulu",
    letter_date: "2026-11-20",
    received_date: "2026-11-21",
    subject: "Permohonan Pembinaan & Monitoring Bumdes Pesisir",
    urgency: "segera",
    disposition_status: "didisposisikan",
    dispositions: [
      {
        id: "disp-1",
        target_user_id: "770e8400-e29b-41d4-a716-446655440004",
        target_user_name: "Kasi Pelayanan Kec. Laeya",
        instruction: "Jadwalkan kunjungan pembinaan minggu depan.",
        status: "didisposisikan",
        action_note: null,
        created_at: "2026-11-21T10:00:00Z",
      },
    ],
  },
];

export const INITIAL_OUTGOING_LETTERS: OutgoingLetterItem[] = [
  {
    id: "out-1",
    district_id: DISTRICT_LAEYA_ID,
    target_village_id: VILLAGE_TOROBULU_ID,
    classification_id: "cls-500",
    classification_code: "500",
    letter_number: "500/041/KEC-LAEYA/XI/2026",
    letter_type: "rekomendasi",
    recipient: "Hasnah Rahayu (UMKM Torobulu)",
    letter_date: "2026-11-21",
    subject: "Surat Rekomendasi Izin Usaha Mikro dan Kecil (IUMK)",
    service_request_id: "sr-2",
    created_at: "2026-11-21T14:00:00Z",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-1",
    district_id: DISTRICT_LAEYA_ID,
    user_name: "Ansar",
    role: "camat_sekcam",
    action: "STATUS_CHANGE",
    entity_type: "quarterly_reports",
    entity_id: "rep-1",
    summary: "Memverifikasi LPPD Triwulan III 2026 Desa Torobulu",
    ip_address: "127.0.0.1",
    created_at: "2026-10-12T14:20:00Z",
  },
  {
    id: "aud-2",
    district_id: DISTRICT_LAEYA_ID,
    user_name: "Kasi Pelayanan Kec. Laeya",
    role: "kasi_pelayanan",
    action: "DOWNLOAD_PRIVATE_DOC",
    entity_type: "service_documents",
    entity_id: "doc-1",
    summary: "Mengunduh dokumen privat KTP & KK Pemohon (PATEN-740511-2026-0042)",
    ip_address: "127.0.0.1",
    created_at: "2026-11-23T09:15:00Z",
  },
];

export const INITIAL_BACKUP_LOGS: BackupLogItem[] = [
  {
    id: "bak-1",
    file_name: "sippakades_20261123_020000.sql.gz",
    file_size_bytes: 1845200,
    status: "success",
    triggered_by_name: "System Scheduler",
    started_at: "2026-11-23T02:00:00Z",
    finished_at: "2026-11-23T02:00:04Z",
    notes: "Backup harian otomatis berhasil.",
  },
];

export interface CompletenessRow {
  village_id: string;
  village_name: string;
  village_type: string;
  has_profile: boolean;
  officials_count: number;
  potentials_count: number;
  tourism_count: number;
  completeness_pct: number;
  missing_items: string[];
}

export interface TimelinessRow {
  village_id: string;
  village_name: string;
  report_type_id: string;
  report_type_name: string;
  period_label: string;
  deadline_at: string;
  submitted_at: string | null;
  report_status: ReportStatus | "belum_ada";
  timeliness_status: TimelinessStatus;
  delay_days: number;
}

export const INITIAL_PUBLICATION_ANNOUNCEMENTS: Array<{
  id: string;
  district_id: string;
  title: string;
  slug: string;
  category: "berita" | "pengumuman" | "agenda";
  excerpt: string;
  content: string;
  status: PublicationStatus;
  published_at: string;
}> = [];
