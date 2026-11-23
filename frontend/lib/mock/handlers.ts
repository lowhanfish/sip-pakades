import {
  ApiEnvelope,
  AuthSessionData,
  DistrictItem,
  OptionItem,
  PaginatedResponse,
  UserProfile,
  VillageItem,
} from "@/types/global";
import {
  BASE_ADMIN_MENUS,
  INITIAL_DISTRICTS,
  INITIAL_VILLAGES,
  MOCK_USERS,
} from "./seed-data";

const STORAGE_KEYS = {
  SESSION_USER: "sippakades_mock_user_id",
  DISTRICTS: "sippakades_mock_districts_v1",
  VILLAGES: "sippakades_mock_villages_v1",
};

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors in browser storage
  }
}

function getDistricts(): DistrictItem[] {
  return readStore<DistrictItem[]>(STORAGE_KEYS.DISTRICTS, INITIAL_DISTRICTS);
}

function saveDistricts(items: DistrictItem[]): void {
  writeStore(STORAGE_KEYS.DISTRICTS, items);
}

function getVillages(): VillageItem[] {
  return readStore<VillageItem[]>(STORAGE_KEYS.VILLAGES, INITIAL_VILLAGES);
}

function saveVillages(items: VillageItem[]): void {
  writeStore(STORAGE_KEYS.VILLAGES, items);
}

function getCurrentMockUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const uid = window.localStorage.getItem(STORAGE_KEYS.SESSION_USER);
  if (!uid) return null;
  return MOCK_USERS.find((u) => u.id === uid) ?? null;
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function parseQuery(urlStr: string): { pathname: string; params: URLSearchParams } {
  const parsed = new URL(urlStr, "http://localhost");
  return { pathname: parsed.pathname, params: parsed.searchParams };
}

function getDistrictScopedVillages(user: UserProfile | null, districtIdParam: string | null): VillageItem[] {
  const all = getVillages();
  const districts = getDistricts();
  const districtMap = new Map(districts.map((d) => [d.id, d.name]));

  return all
    .map((v) => ({
      ...v,
      district_name: districtMap.get(v.district_id) ?? v.district_name ?? "-",
    }))
    .filter((v) => {
      if (user?.role === "operator_desa") {
        return v.id === user.village_id;
      }
      if (user && user.role !== "superadmin_kab" && user.district_id) {
        if (v.district_id !== user.district_id) return false;
      }
      if (districtIdParam && v.district_id !== districtIdParam) {
        return false;
      }
      return true;
    });
}

export async function handleMockRequest<T>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  // Small natural delay for realistic loading states
  await new Promise((r) => setTimeout(r, 120));

  const { pathname, params } = parseQuery(url);
  const httpMethod = method.toUpperCase();
  const currentUser = getCurrentMockUser();

  // ================= AUTH =================
  if (pathname === "/api/v1/auth/login" && httpMethod === "POST") {
    const payload = (body ?? {}) as { username?: string; password?: string };
    const found = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === (payload.username ?? "").trim().toLowerCase()
    );
    if (!found || !payload.password) {
      throw new Error("Username atau kata sandi tidak valid.");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.SESSION_USER, found.id);
    }
    const resp: ApiEnvelope<AuthSessionData> = {
      success: true,
      message: "Autentikasi berhasil",
      data: {
        user: found,
        csrf_token: "mock-csrf-token",
        menus: BASE_ADMIN_MENUS,
      },
    };
    return resp as T;
  }

  if (pathname === "/api/v1/auth/me" && httpMethod === "GET") {
    if (!currentUser) {
      throw new Error("Sesi belum terautentikasi.");
    }
    const resp: ApiEnvelope<AuthSessionData> = {
      success: true,
      message: "Sesi aktif",
      data: {
        user: currentUser,
        csrf_token: "mock-csrf-token",
        menus: BASE_ADMIN_MENUS,
      },
    };
    return resp as T;
  }

  if (pathname === "/api/v1/auth/refresh" && httpMethod === "POST") {
    if (!currentUser) {
      throw new Error("Refresh sesi gagal.");
    }
    return {
      success: true,
      message: "Sesi diperbarui",
      data: { csrf_token: "mock-csrf-token", user: currentUser },
    } as T;
  }

  if (
    (pathname === "/api/v1/auth/logout" || pathname === "/api/v1/auth/logout-all") &&
    httpMethod === "POST"
  ) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    }
    return { success: true, message: "Berhasil keluar", data: null } as T;
  }

  // ================= PUBLISH =================
  if (pathname === "/api/v1/publish/districts" && httpMethod === "GET") {
    const villages = getVillages();
    const activeOnly = params.get("active_only") !== "false";
    const items = getDistricts()
      .filter((d) => (!activeOnly ? true : d.is_active))
      .map((d) => ({
        ...d,
        village_count: villages.filter((v) => v.district_id === d.id && v.is_active).length,
      }));
    return { success: true, message: "OK", data: items } as T;
  }

  // ================= MASTER KECAMATAN =================
  if (pathname === "/api/v1/admin/master/kecamatan/read" && httpMethod === "GET") {
    const search = (params.get("search") ?? "").trim().toLowerCase();
    const skip = Number(params.get("skip") ?? 0);
    const limit = Number(params.get("limit") ?? 10);
    const villages = getVillages();

    let items = getDistricts().map((d) => ({
      ...d,
      village_count: villages.filter((v) => v.district_id === d.id).length,
    }));

    if (currentUser && currentUser.role !== "superadmin_kab" && currentUser.district_id) {
      items = items.filter((d) => d.id === currentUser.district_id);
    }
    if (search) {
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.code.toLowerCase().includes(search) ||
          d.slug.toLowerCase().includes(search)
      );
    }

    const result: PaginatedResponse<DistrictItem> = {
      total: items.length,
      skip,
      limit,
      data: items.slice(skip, skip + limit),
    };
    return result as T;
  }

  if (pathname === "/api/v1/admin/master/kecamatan/option" && httpMethod === "GET") {
    let items = getDistricts().filter((d) => d.is_active);
    if (currentUser && currentUser.role !== "superadmin_kab" && currentUser.district_id) {
      items = items.filter((d) => d.id === currentUser.district_id);
    }
    const options: OptionItem[] = items.map((d) => ({
      id: d.id,
      label: d.name,
      code: d.code,
      meta: { slug: d.slug, is_default: d.is_default },
    }));
    return options as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/kecamatan/detail/") && httpMethod === "GET") {
    const id = pathname.split("/").pop() ?? "";
    const found = getDistricts().find((d) => d.id === id);
    if (!found) throw new Error("Data kecamatan tidak ditemukan.");
    return { success: true, message: "OK", data: found } as T;
  }

  if (pathname === "/api/v1/admin/master/kecamatan/create" && httpMethod === "POST") {
    if (currentUser?.role !== "superadmin_kab") {
      throw new Error("Hanya Superadmin Kabupaten yang dapat menambah kecamatan.");
    }
    const input = body as Partial<DistrictItem>;
    const list = getDistricts();
    if (list.some((d) => d.code === input.code || d.slug === input.slug)) {
      throw new Error("Kode wilayah atau slug kecamatan sudah digunakan.");
    }
    const now = new Date().toISOString();
    const created: DistrictItem = {
      id: makeUuid(),
      code: input.code ?? "",
      name: input.name ?? "",
      slug: input.slug ?? (input.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      office_address: input.office_address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      service_hours: input.service_hours ?? "Senin–Jumat, 08.00–16.00 WITA",
      vision: input.vision ?? null,
      mission: input.mission ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      is_active: input.is_active ?? true,
      is_default: Boolean(input.is_default),
      created_by: currentUser.id,
      updated_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };
    const nextList = created.is_default
      ? list.map((d) => ({ ...d, is_default: false })).concat(created)
      : [created, ...list];
    saveDistricts(nextList);
    return { success: true, message: "Kecamatan berhasil ditambahkan", data: created } as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/kecamatan/update/") && httpMethod === "PUT") {
    if (currentUser?.role !== "superadmin_kab") {
      throw new Error("Hanya Superadmin Kabupaten yang dapat mengubah master kecamatan.");
    }
    const id = pathname.split("/").pop() ?? "";
    const input = body as Partial<DistrictItem>;
    const list = getDistricts();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Data kecamatan tidak ditemukan.");
    const updated: DistrictItem = {
      ...list[idx],
      ...input,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    };
    const nextList = list.map((d, i) => {
      if (i === idx) return updated;
      return updated.is_default ? { ...d, is_default: false } : d;
    });
    saveDistricts(nextList);
    return { success: true, message: "Kecamatan berhasil diperbarui", data: updated } as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/kecamatan/delete/") && httpMethod === "DELETE") {
    if (currentUser?.role !== "superadmin_kab") {
      throw new Error("Hanya Superadmin Kabupaten yang dapat menghapus master kecamatan.");
    }
    const id = pathname.split("/").pop() ?? "";
    const villages = getVillages();
    if (villages.some((v) => v.district_id === id)) {
      throw new Error("Kecamatan tidak dapat dihapus karena masih memiliki data desa/kelurahan.");
    }
    const list = getDistricts().filter((d) => d.id !== id);
    saveDistricts(list);
    return { success: true, message: "Kecamatan berhasil dihapus", data: { id } } as T;
  }

  // ================= MASTER DESA / KELURAHAN =================
  if (pathname === "/api/v1/admin/master/desa/read" && httpMethod === "GET") {
    const search = (params.get("search") ?? "").trim().toLowerCase();
    const districtId = params.get("district_id");
    const typeFilter = params.get("type");
    const skip = Number(params.get("skip") ?? 0);
    const limit = Number(params.get("limit") ?? 10);

    let items = getDistrictScopedVillages(currentUser, districtId);
    if (typeFilter) {
      items = items.filter((v) => v.type === typeFilter);
    }
    if (search) {
      items = items.filter(
        (v) =>
          v.name.toLowerCase().includes(search) ||
          v.code.toLowerCase().includes(search) ||
          (v.district_name ?? "").toLowerCase().includes(search)
      );
    }

    const result: PaginatedResponse<VillageItem> = {
      total: items.length,
      skip,
      limit,
      data: items.slice(skip, skip + limit),
    };
    return result as T;
  }

  if (pathname === "/api/v1/admin/master/desa/option" && httpMethod === "GET") {
    const districtId = params.get("district_id");
    const items = getDistrictScopedVillages(currentUser, districtId).filter((v) => v.is_active);
    const options: OptionItem[] = items.map((v) => ({
      id: v.id,
      label: `${v.type === "kelurahan" ? "Kel." : "Desa"} ${v.name}`,
      code: v.code,
      meta: { district_id: v.district_id, type: v.type },
    }));
    return options as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/desa/detail/") && httpMethod === "GET") {
    const id = pathname.split("/").pop() ?? "";
    const found = getDistrictScopedVillages(currentUser, null).find((v) => v.id === id);
    if (!found) throw new Error("Data desa/kelurahan tidak ditemukan atau di luar cakupan wilayah Anda.");
    return { success: true, message: "OK", data: found } as T;
  }

  if (pathname === "/api/v1/admin/master/desa/create" && httpMethod === "POST") {
    if (!currentUser || !["superadmin_kab", "admin_kecamatan"].includes(currentUser.role)) {
      throw new Error("Anda tidak memiliki hak akses menambah desa/kelurahan.");
    }
    const input = body as Partial<VillageItem>;
    const targetDistrictId =
      currentUser.role === "admin_kecamatan" ? currentUser.district_id ?? "" : input.district_id ?? "";
    if (!targetDistrictId) {
      throw new Error("Kecamatan induk wajib dipilih.");
    }
    const list = getVillages();
    if (list.some((v) => v.code === input.code)) {
      throw new Error("Kode desa/kelurahan sudah terdaftar.");
    }
    const now = new Date().toISOString();
    const created: VillageItem = {
      id: makeUuid(),
      district_id: targetDistrictId,
      code: input.code ?? "",
      name: input.name ?? "",
      slug: input.slug ?? (input.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      type: input.type ?? "desa",
      description: input.description ?? null,
      history: input.history ?? null,
      boundaries: input.boundaries ?? null,
      area_km2: input.area_km2 ?? null,
      dusun_count: input.dusun_count ?? 0,
      rw_count: input.rw_count ?? 0,
      rt_count: input.rt_count ?? 0,
      population_total: input.population_total ?? 0,
      household_total: input.household_total ?? 0,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      is_active: input.is_active ?? true,
      created_by: currentUser.id,
      updated_by: currentUser.id,
      created_at: now,
      updated_at: now,
    };
    saveVillages([created, ...list]);
    return { success: true, message: "Desa/Kelurahan berhasil ditambahkan", data: created } as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/desa/update/") && httpMethod === "PUT") {
    if (!currentUser || !["superadmin_kab", "admin_kecamatan"].includes(currentUser.role)) {
      throw new Error("Anda tidak memiliki hak akses mengubah desa/kelurahan.");
    }
    const id = pathname.split("/").pop() ?? "";
    const list = getVillages();
    const idx = list.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Data desa/kelurahan tidak ditemukan.");
    if (
      currentUser.role === "admin_kecamatan" &&
      list[idx].district_id !== currentUser.district_id
    ) {
      throw new Error("Akses ditolak: desa bukan bagian dari kecamatan Anda.");
    }
    const input = body as Partial<VillageItem>;
    const updated: VillageItem = {
      ...list[idx],
      ...input,
      district_id:
        currentUser.role === "admin_kecamatan"
          ? list[idx].district_id
          : input.district_id ?? list[idx].district_id,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    saveVillages(list);
    return { success: true, message: "Desa/Kelurahan berhasil diperbarui", data: updated } as T;
  }

  if (pathname.startsWith("/api/v1/admin/master/desa/delete/") && httpMethod === "DELETE") {
    if (!currentUser || !["superadmin_kab", "admin_kecamatan"].includes(currentUser.role)) {
      throw new Error("Anda tidak memiliki hak akses menghapus desa/kelurahan.");
    }
    const id = pathname.split("/").pop() ?? "";
    const list = getVillages();
    const target = list.find((v) => v.id === id);
    if (!target) throw new Error("Data desa/kelurahan tidak ditemukan.");
    if (
      currentUser.role === "admin_kecamatan" &&
      target.district_id !== currentUser.district_id
    ) {
      throw new Error("Akses ditolak: desa bukan bagian dari kecamatan Anda.");
    }
    saveVillages(list.filter((v) => v.id !== id));
    return { success: true, message: "Desa/Kelurahan berhasil dihapus", data: { id } } as T;
  }

  throw new Error(`Endpoint mock belum terdaftar: ${httpMethod} ${pathname}`);
}
