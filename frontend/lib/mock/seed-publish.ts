import { ServiceStatus } from "@/types/global";
import {
  DISTRICT_LAEYA_ID,
  VILLAGE_PUUNGGALUKU_ID,
  VILLAGE_TOROBULU_ID,
} from "./seed-data";

export interface PublicLeader {
  full_name: string;
  position_name: string;
  nip: string | null;
  photo_url: string | null;
  welcome_message: string;
}

export interface PublicOrgNode {
  position: string;
  name: string;
  nip?: string | null;
}

export interface PublicPotentialItem {
  id: string;
  district_id: string;
  village_id: string;
  village_name: string;
  category_id: string;
  category_name: string;
  title: string;
  description: string;
  metric_value: number;
  metric_unit: string;
  period_year: number;
}

export interface PublicTourismItem {
  id: string;
  district_id: string;
  village_id: string;
  village_name: string;
  category_name: string;
  name: string;
  description: string;
  address: string;
  facilities: string[];
  opening_hours: string;
  ticket_info: string;
  latitude: number;
  longitude: number;
}

export interface PublicAnnouncementItem {
  id: string;
  district_id: string;
  slug: string;
  title: string;
  category: "berita" | "pengumuman" | "agenda";
  excerpt: string;
  content: string;
  published_at: string;
}

export interface PublicRegulationItem {
  id: string;
  district_id: string;
  title: string;
  regulation_number: string;
  year: number;
  category: "Perdes" | "SK Camat" | "SOP PATEN" | "Edaran";
  description: string;
}

export interface PublicServiceTypeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  sla_days: number;
  requirements: Array<{ code: string; label: string; required: boolean }>;
}

export interface PublicServiceTrackResponse {
  registration_number: string;
  district_name: string;
  village_name: string;
  service_type_name: string;
  applicant_name_masked: string;
  status: ServiceStatus;
  sla_days: number;
  sla_due_at: string;
  submitted_at: string;
  updated_at: string;
  timeline: Array<{
    status: ServiceStatus;
    public_note: string;
    changed_at: string;
  }>;
}

export const LAEYA_LEADER: PublicLeader = {
  full_name: "Ansar",
  position_name: "Camat Laeya",
  nip: "197805142005011008",
  photo_url: "/img/camat-laeya.webp",
  welcome_message:
    "Selamat datang di Portal Resmi SIP-PAKADES Kecamatan Laeya, Kabupaten Konawe Selatan. Kami berkomitmen menghadirkan pelayanan administrasi yang cepat, transparan, dan akuntabel serta memperkuat sinergi pembangunan bersama 2 kelurahan dan 15 desa di Kecamatan Laeya.",
};

export const LAEYA_ORG_STRUCTURE: PublicOrgNode[] = [
  { position: "Camat Laeya", name: "Ansar", nip: "197805142005011008" },
  { position: "Sekretaris Camat (Sekcam)", name: "Hendra Wijaya, S.Sos" },
  { position: "Kasi Pemerintahan", name: "Muhammad Rizal, S.IP" },
  { position: "Kasi Pelayanan Umum (PATEN)", name: "Siti Rahmawati, S.AP" },
  { position: "Kasi Pemberdayaan Masyarakat Desa", name: "La Ode Nasrun, S.Sos" },
  { position: "Kasi Ketenteraman & Ketertiban (Trantibum)", name: "Agus Salim, S.H" },
];

export const MOCK_VILLAGE_OFFICIALS: Record<
  string,
  Array<{ position_name: string; full_name: string; phone?: string }>
> = {
  [VILLAGE_PUUNGGALUKU_ID]: [
    { position_name: "Lurah Puunggaluku", full_name: "Darwis, S.Sos" },
    { position_name: "Sekretaris Kelurahan", full_name: "Nurlina, S.AP" },
    { position_name: "Kasi Pemerintahan", full_name: "Basrianto" },
  ],
  [VILLAGE_TOROBULU_ID]: [
    { position_name: "Kepala Desa Torobulu", full_name: "H. Syahrir" },
    { position_name: "Sekretaris Desa", full_name: "Hasnah, S.Pd" },
    { position_name: "Kaur Pemerintahan", full_name: "Irwan Saputra" },
  ],
};

export const MOCK_POTENTIALS: PublicPotentialItem[] = [
  {
    id: "pot-1",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Torobulu",
    category_id: "cat-perikanan",
    category_name: "Perikanan & Kelautan",
    title: "Perikanan Tangkap & Pelabuhan Penyeberangan Torobulu",
    description:
      "Sentra hasil tangkapan ikan pelagis, rumput laut, serta simpul logistik laut Torobulu–Tampo.",
    metric_value: 485,
    metric_unit: "Ton/Tahun",
    period_year: 2026,
  },
  {
    id: "pot-2",
    district_id: DISTRICT_LAEYA_ID,
    village_id: "660e8400-e29b-41d4-a716-446655440003",
    village_name: "Aepodu",
    category_id: "cat-pertanian",
    category_name: "Pertanian Pangan",
    title: "Lahan Persawahan Irigasi Padi Sawah",
    description:
      "Lumbung padi lokal dengan pola tanam dua kali setahun dan dukungan kelompok tani aktif.",
    metric_value: 340,
    metric_unit: "Ha",
    period_year: 2026,
  },
  {
    id: "pot-3",
    district_id: DISTRICT_LAEYA_ID,
    village_id: "660e8400-e29b-41d4-a716-446655440011",
    village_name: "Lamong Jaya",
    category_id: "cat-peternakan",
    category_name: "Peternakan Rakyat",
    title: "Sentra Pembibitan Sapi Potong & Ternak Terpadu",
    description:
      "Pengembangan ternak sapi Bali terintegrasi dengan pakan hijauan dan pengolahan pupuk organik.",
    metric_value: 620,
    metric_unit: "Ekor",
    period_year: 2026,
  },
  {
    id: "pot-4",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_PUUNGGALUKU_ID,
    village_name: "Puunggaluku",
    category_id: "cat-umkm",
    category_name: "UMKM & Perdagangan",
    title: "Pasar Sentral & UMKM Olahan Hasil Bumi Puunggaluku",
    description:
      "Pusat perdagangan kecamatan, kuliner lokal, dan pelaku usaha mikro berizin IUMK.",
    metric_value: 148,
    metric_unit: "Unit Usaha",
    period_year: 2026,
  },
  {
    id: "pot-5",
    district_id: DISTRICT_LAEYA_ID,
    village_id: "660e8400-e29b-41d4-a716-446655440004",
    village_name: "Ambakumina",
    category_id: "cat-perkebunan",
    category_name: "Perkebunan",
    title: "Komoditas Kakao, Lada & Kelapa Dalam",
    description:
      "Perkebunan rakyat unggulan dengan program peremajaan tanaman kakao dan lada.",
    metric_value: 275,
    metric_unit: "Ha",
    period_year: 2026,
  },
];

export const MOCK_TOURISM: PublicTourismItem[] = [
  {
    id: "tour-1",
    district_id: DISTRICT_LAEYA_ID,
    village_id: VILLAGE_TOROBULU_ID,
    village_name: "Torobulu",
    category_name: "Wisata Bahari",
    name: "Pantai & Kawasan Pesisir Torobulu",
    description:
      "Destinasi pesisir dengan panorama Teluk Tiworo, kuliner ikan bakar segar, dan dermaga wisata bahari.",
    address: "Desa Torobulu, Kec. Laeya, Kab. Konawe Selatan",
    facilities: ["Area Parkir", "Gazebo Pesisir", "Kuliner Seafood", "Mushola"],
    opening_hours: "Setiap Hari, 06.00–19.00 WITA",
    ticket_info: "Gratis / Retribusi Parkir Lokal",
    latitude: -4.3556,
    longitude: 122.4958,
  },
  {
    id: "tour-2",
    district_id: DISTRICT_LAEYA_ID,
    village_id: "660e8400-e29b-41d4-a716-446655440012",
    village_name: "Lerepako",
    category_name: "Wisata Alam",
    name: "Permandian Alam & Bukit Hijau Lerepako",
    description:
      "Wisata alam mata air jernih dan perbukitan asri yang cocok untuk rekreasi keluarga di akhir pekan.",
    address: "Desa Lerepako, Kec. Laeya, Kab. Konawe Selatan",
    facilities: ["Kolam Alami", "Saung Istirahat", "Toilet Umum", "Area Kemah"],
    opening_hours: "Setiap Hari, 07.30–17.30 WITA",
    ticket_info: "Rp 5.000 / Pengunjung",
    latitude: -4.328,
    longitude: 122.462,
  },
  {
    id: "tour-3",
    district_id: DISTRICT_LAEYA_ID,
    village_id: "660e8400-e29b-41d4-a716-446655440010",
    village_name: "Lambakara",
    category_name: "Ekowisata",
    name: "Ekowisata Mangrove & Tambak Lambakara",
    description:
      "Jalur susur hutan mangrove pesisir dengan edukasi konservasi ekosistem laut dan budidaya perikanan.",
    address: "Desa Lambakara, Kec. Laeya, Kab. Konawe Selatan",
    facilities: ["Jembatan Kayu Mangrove", "Spot Foto", "Perahu Nelayan"],
    opening_hours: "Setiap Hari, 07.00–17.00 WITA",
    ticket_info: "Rp 5.000 / Pengunjung",
    latitude: -4.294,
    longitude: 122.502,
  },
];

export const MOCK_ANNOUNCEMENTS: PublicAnnouncementItem[] = [
  {
    id: "ann-1",
    district_id: DISTRICT_LAEYA_ID,
    slug: "sosialisasi-pelaporan-triwulan-iv-2026-kecamatan-laeya",
    title: "Rapat Koordinasi & Evaluasi Pelaporan Triwulan IV Tahun 2026",
    category: "berita",
    excerpt:
      "Camat Laeya memimpin rapat koordinasi bersama seluruh Kepala Desa dan Lurah terkait ketepatan waktu pelaporan triwulanan.",
    content:
      "Kantor Kecamatan Laeya menggelar rapat koordinasi bersama 15 Kepala Desa dan 2 Lurah guna mempercepat penyampaian Laporan Penyelenggaraan Pemerintahan Desa (LPPD) dan Realisasi APBDes Triwulan IV Tahun 2026 melalui sistem SIP-PAKADES.",
    published_at: "2026-11-20T09:00:00Z",
  },
  {
    id: "ann-2",
    district_id: DISTRICT_LAEYA_ID,
    slug: "jadwal-pelayanan-paten-kecamatan-laeya",
    title: "Maklumat Pelayanan PATEN & Pengurusan Rekomendasi Nikah / IUMK",
    category: "pengumuman",
    excerpt:
      "Informasi jam operasional loket PATEN Kantor Kecamatan Laeya serta persyaratan pengantar dari desa/kelurahan.",
    content:
      "Loket Pelayanan Administrasi Terpadu Kecamatan (PATEN) Kecamatan Laeya buka setiap hari Senin hingga Jumat pukul 08.00–16.00 WITA. Warga dapat memantau progres pengajuan secara online menggunakan Nomor Registrasi layanan.",
    published_at: "2026-11-18T08:00:00Z",
  },
  {
    id: "ann-3",
    district_id: DISTRICT_LAEYA_ID,
    slug: "pengembangan-potensi-pesisir-torobulu-lerepako",
    title: "Sinergi Pengembangan Potensi Pesisir & Wisata Bahari Laeya",
    category: "agenda",
    excerpt:
      "Program pendampingan UMKM pesisir dan penataan destinasi wisata di Desa Torobulu, Lambakara, dan Lerepako.",
    content:
      "Kecamatan Laeya mendorong pemetaan potensi wilayah unggulan dan penerbitan rekomendasi IUMK bagi pelaku usaha mikro di kawasan pesisir dan pasar sentral Puunggaluku.",
    published_at: "2026-11-12T10:30:00Z",
  },
];

export const MOCK_REGULATIONS: PublicRegulationItem[] = [
  {
    id: "reg-1",
    district_id: DISTRICT_LAEYA_ID,
    title: "Standar Operasional Prosedur (SOP) Pelayanan Administrasi Terpadu Kecamatan (PATEN)",
    regulation_number: "SK Camat No. 140/12/2026",
    year: 2026,
    category: "SOP PATEN",
    description: "Pedoman alur pelayanan, persyaratan berkas, dan target SLA layanan Kecamatan Laeya.",
  },
  {
    id: "reg-2",
    district_id: DISTRICT_LAEYA_ID,
    title: "Pedoman Penyampaian Laporan Triwulanan Desa dan Kelurahan",
    regulation_number: "SE Camat No. 140/08/2026",
    year: 2026,
    category: "Edaran",
    description: "Ketentuan batas waktu pengajuan laporan TW I–IV serta mekanisme verifikasi kecamatan.",
  },
  {
    id: "reg-3",
    district_id: DISTRICT_LAEYA_ID,
    title: "Peraturan Desa Torobulu tentang Pengelolaan Kawasan Pesisir & Retribusi Wisata",
    regulation_number: "Perdes No. 04 Tahun 2025",
    year: 2025,
    category: "Perdes",
    description: "Regulasi desa terkait tata kelola kebersihan, parkir, dan pemberdayaan UMKM kawasan wisata.",
  },
];

export const MOCK_SERVICE_TYPES: PublicServiceTypeItem[] = [
  {
    id: "srv-nikah",
    code: "PATEN-NKH",
    name: "Rekomendasi / Dispensasi Nikah",
    description:
      "Surat pengantar dan rekomendasi nikah ke KUA Kecamatan, termasuk layanan dispensasi nikah apabila pelaksanaan kurang dari 10 hari kerja.",
    sla_days: 2,
    requirements: [
      { code: "pengantar_desa", label: "Surat Pengantar Nikah (N1–N4) dari Desa/Kelurahan", required: true },
      { code: "ktp_kk", label: "Fotokopi KTP-el & Kartu Keluarga Calon Mempelai", required: true },
      { code: "akta_lahir", label: "Fotokopi Akta Kelahiran / Ijazah Terakhir", required: true },
    ],
  },
  {
    id: "srv-iumk",
    code: "PATEN-IUMK",
    name: "Rekomendasi Izin Usaha Mikro & Kecil (IUMK)",
    description:
      "Penerbitan surat keterangan dan rekomendasi izin usaha mikro/kecil bagi pelaku UMKM di wilayah Kecamatan Laeya.",
    sla_days: 3,
    requirements: [
      { code: "pengantar_desa", label: "Surat Keterangan Usaha dari Kepala Desa / Lurah", required: true },
      { code: "ktp_kk", label: "Fotokopi KTP-el & Kartu Keluarga Pemohon", required: true },
      { code: "foto_usaha", label: "Foto Lokasi / Kegiatan Usaha", required: false },
    ],
  },
  {
    id: "srv-kependudukan",
    code: "PATEN-ADK",
    name: "Pengantar Administrasi Kependudukan & Pertanahan",
    description:
      "Rekomendasi pindah datang antar-kecamatan/kabupaten, SKTM keperluan khusus (RS/beasiswa), serta register pengesahan surat keterangan ahli waris.",
    sla_days: 3,
    requirements: [
      { code: "pengantar_desa", label: "Surat Pengantar Resmi dari Desa/Kelurahan", required: true },
      { code: "ktp_kk", label: "Fotokopi KTP-el & Kartu Keluarga Pemohon", required: true },
      { code: "berkas_pendukung", label: "Dokumen Pendukung Sesuai Keperluan (SKTM / Ahli Waris / Pindah)", required: true },
    ],
  },
];

export const MOCK_TRACKING_RECORDS: PublicServiceTrackResponse[] = [
  {
    registration_number: "PATEN-740511-2026-0042",
    district_name: "Laeya",
    village_name: "Kel. Puunggaluku",
    service_type_name: "Rekomendasi / Dispensasi Nikah",
    applicant_name_masked: "A*** S***",
    status: "diproses",
    sla_days: 2,
    sla_due_at: "2026-11-25T16:00:00Z",
    submitted_at: "2026-11-23T09:00:00Z",
    updated_at: "2026-11-23T11:15:00Z",
    timeline: [
      {
        status: "diterima",
        public_note: "Permohonan didaftarkan dengan surat pengantar Kelurahan Puunggaluku.",
        changed_at: "2026-11-23T09:00:00Z",
      },
      {
        status: "diproses",
        public_note: "Berkas persyaratan dinyatakan lengkap, sedang proses tanda tangan Camat.",
        changed_at: "2026-11-23T11:15:00Z",
      },
    ],
  },
  {
    registration_number: "PATEN-740511-2026-0041",
    district_name: "Laeya",
    village_name: "Desa Torobulu",
    service_type_name: "Rekomendasi Izin Usaha Mikro & Kecil (IUMK)",
    applicant_name_masked: "H*** R***",
    status: "selesai",
    sla_days: 3,
    sla_due_at: "2026-11-22T16:00:00Z",
    submitted_at: "2026-11-19T10:20:00Z",
    updated_at: "2026-11-21T14:00:00Z",
    timeline: [
      {
        status: "diterima",
        public_note: "Permohonan diterima dari Operator Desa Torobulu.",
        changed_at: "2026-11-19T10:20:00Z",
      },
      {
        status: "diproses",
        public_note: "Verifikasi usaha mikro oleh Kasi Pelayanan.",
        changed_at: "2026-11-20T09:30:00Z",
      },
      {
        status: "selesai",
        public_note: "Surat Rekomendasi IUMK telah terbit dan siap diambil di loket PATEN.",
        changed_at: "2026-11-21T14:00:00Z",
      },
    ],
  },
  {
    registration_number: "PATEN-740511-2026-0040",
    district_name: "Laeya",
    village_name: "Desa Lamong Jaya",
    service_type_name: "Pengantar Administrasi Kependudukan & Pertanahan",
    applicant_name_masked: "M*** Y***",
    status: "perlu_kelengkapan",
    sla_days: 3,
    sla_due_at: "2026-11-24T16:00:00Z",
    submitted_at: "2026-11-21T08:45:00Z",
    updated_at: "2026-11-21T13:10:00Z",
    timeline: [
      {
        status: "diterima",
        public_note: "Permohonan diterima di loket PATEN Kecamatan Laeya.",
        changed_at: "2026-11-21T08:45:00Z",
      },
      {
        status: "perlu_kelengkapan",
        public_note: "Mohon melampirkan fotokopi Kartu Keluarga terbaru yang telah dilegalisir desa.",
        changed_at: "2026-11-21T13:10:00Z",
      },
    ],
  },
];
