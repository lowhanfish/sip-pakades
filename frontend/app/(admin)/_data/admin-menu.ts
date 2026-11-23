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

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    group: "Utama",
    items: [
      {
        code: "dashboard",
        label: "Dashboard",
        href: "/admin",
        roles: ALL_INTERNAL_ROLES,
      },
    ],
  },
  {
    group: "Data Master Wilayah",
    items: [
      {
        code: "master-kecamatan",
        label: "Master Kecamatan",
        href: "/admin/master/kecamatan",
        roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam", "kasi_pelayanan"],
      },
      {
        code: "master-desa",
        label: "Master Desa/Kelurahan",
        href: "/admin/master/desa",
        roles: ["superadmin_kab", "admin_kecamatan", "camat_sekcam", "kasi_pelayanan"],
      },
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
