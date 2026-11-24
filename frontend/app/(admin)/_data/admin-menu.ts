import { RoleCode } from "@/types/global";

export interface AdminNavItem {
  code: string;
  label: string;
  href: string;
  roles: RoleCode[];
}

export interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

const ALL_INTERNAL_ROLES: RoleCode[] = [
  "superadmin_kab",
  "admin_kecamatan",
  "camat_sekcam",
  "kasi_pelayanan",
  "operator_desa",
];

const KECAMATAN_LEAD_ROLES: RoleCode[] = [
  "superadmin_kab",
  "admin_kecamatan",
  "camat_sekcam",
  "kasi_pelayanan",
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    group: "Utama",
    items: [
      { code: "dashboard", label: "Dashboard", href: "/admin", roles: ALL_INTERNAL_ROLES },
    ],
  },
  {
    group: "Pemerintahan & Publikasi",
    items: [
      { code: "pemerintahan-perangkat", label: "Perangkat Pemerintahan", href: "/admin/pemerintahan/perangkat", roles: ALL_INTERNAL_ROLES },
      { code: "pemerintahan-potensi", label: "Potensi Wilayah", href: "/admin/pemerintahan/potensi", roles: ALL_INTERNAL_ROLES },
      { code: "pemerintahan-wisata", label: "Destinasi Wisata", href: "/admin/pemerintahan/wisata", roles: ALL_INTERNAL_ROLES },
      { code: "publikasi-berita", label: "Berita & Pengumuman", href: "/admin/publikasi/berita", roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam"] },
      { code: "publikasi-regulasi", label: "Regulasi & SOP", href: "/admin/publikasi/regulasi", roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam"] },
    ],
  },
  {
    group: "Pelaporan Triwulanan",
    items: [
      { code: "pelaporan-triwulan", label: "Laporan Triwulanan", href: "/admin/pelaporan/triwulan", roles: ALL_INTERNAL_ROLES },
      { code: "pelaporan-verifikasi", label: "Antrean Verifikasi", href: "/admin/pelaporan/verifikasi", roles: KECAMATAN_LEAD_ROLES },
    ],
  },
  {
    group: "Pelayanan & Persuratan",
    items: [
      { code: "pelayanan-permohonan", label: "Pelayanan SIP-PAKADES", href: "/admin/pelayanan/permohonan", roles: ALL_INTERNAL_ROLES },
      { code: "pelayanan-ttd", label: "Penandatanganan Surat", href: "/admin/penandatangan", roles: ["camat_sekcam"] },
      { code: "pelayanan-katalog", label: "Pengaturan Layanan", href: "/admin/pelayanan/layanan", roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam"] },
      { code: "persuratan-masuk", label: "Surat Masuk & Disposisi", href: "/admin/persuratan/surat-masuk", roles: KECAMATAN_LEAD_ROLES },
      { code: "persuratan-keluar", label: "Surat Keluar", href: "/admin/persuratan/surat-keluar", roles: KECAMATAN_LEAD_ROLES },
    ],
  },
  {
    group: "Pemantauan & Sistem",
    items: [
      { code: "pemantauan-kelengkapan", label: "Kelengkapan & Ketepatan", href: "/admin/pemantauan/kelengkapan-ketepatan", roles: KECAMATAN_LEAD_ROLES },
      { code: "pemantauan-rekap", label: "Rekap & Ekspor", href: "/admin/pemantauan/rekap-ekspor", roles: ALL_INTERNAL_ROLES },
      { code: "sistem-pengguna", label: "Manajemen Pengguna", href: "/admin/sistem/pengguna", roles: ["superadmin_kab", "admin_kecamatan"] },
      { code: "sistem-audit", label: "Audit Log", href: "/admin/sistem/audit-log", roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam"] },
      { code: "sistem-backup", label: "Pencadangan DB", href: "/admin/sistem/pencadangan", roles: ["superadmin_kab"] },
    ],
  },
  {
    group: "Data Master",
    items: [
      { code: "master-kecamatan", label: "Master Kecamatan", href: "/admin/master/kecamatan", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-desa", label: "Master Desa/Kelurahan", href: "/admin/master/desa", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-jabatan", label: "Master Jabatan", href: "/admin/master/jabatan", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-kat-potensi", label: "Kategori Potensi", href: "/admin/master/kategori-potensi", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-kat-wisata", label: "Kategori Wisata", href: "/admin/master/kategori-wisata", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-jenis-laporan", label: "Jenis Pelaporan", href: "/admin/master/jenis-laporan", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-periode-laporan", label: "Periode Triwulan", href: "/admin/master/periode-laporan", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-jenis-layanan", label: "Jenis Layanan SIP-PAKADES", href: "/admin/master/jenis-layanan", roles: KECAMATAN_LEAD_ROLES },
      { code: "master-klasifikasi-surat", label: "Klasifikasi Surat", href: "/admin/master/klasifikasi-surat", roles: KECAMATAN_LEAD_ROLES },
    ],
  },
];

export function getAdminMenusForRole(role: RoleCode | undefined): AdminNavGroup[] {
  if (!role) return [];
  return ADMIN_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => item.roles.includes(role)),
  })).filter((g) => g.items.length > 0);
}
