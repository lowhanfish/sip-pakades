import { OptionItem, UserProfile } from "@/types/global";
import {
  DISTRICT_LAEYA_ID,
  INITIAL_DISTRICTS,
  INITIAL_VILLAGES,
  MOCK_USERS,
  VILLAGE_PUUNGGALUKU_ID,
} from "./seed-data";
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_POTENTIALS,
  MOCK_REGULATIONS,
  MOCK_TOURISM,
} from "./seed-publish";
import {
  AuditLogItem,
  BackupLogItem,
  CompletenessRow,
  IncomingLetterItem,
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUP_LOGS,
  INITIAL_INCOMING_LETTERS,
  INITIAL_LETTER_CLASSIFICATIONS,
  INITIAL_MASTER_POSITIONS,
  INITIAL_OFFICIALS,
  INITIAL_OUTGOING_LETTERS,
  INITIAL_POTENTIAL_CATEGORIES,
  INITIAL_REPORT_PERIODS,
  INITIAL_REPORT_TYPES,
  INITIAL_REPORTS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_SERVICE_TYPES_MASTER,
  INITIAL_TOURISM_CATEGORIES,
  OfficialItem,
  OutgoingLetterItem,
  QuarterlyReportItem,
  ServiceRequestItem,
  SimpleMasterItem,
  TimelinessRow,
} from "./seed-admin";

const ADMIN_KEYS: Record<string, string> = {
  jabatan: "sippakades_mock_jabatan_v1",
  "kategori-potensi": "sippakades_mock_cat_potensi_v1",
  "kategori-wisata": "sippakades_mock_cat_wisata_v1",
  "jenis-laporan": "sippakades_mock_jenis_laporan_v1",
  "periode-laporan": "sippakades_mock_periode_laporan_v1",
  "jenis-layanan": "sippakades_mock_jenis_layanan_v1",
  "klasifikasi-surat": "sippakades_mock_klasifikasi_surat_v1",
  OFFICIALS: "sippakades_mock_officials_v1",
  POTENTIALS: "sippakades_mock_potentials_v1",
  TOURISM: "sippakades_mock_tourism_v1",
  ANNOUNCEMENTS: "sippakades_mock_announcements_v1",
  REGULATIONS: "sippakades_mock_regulations_v1",
  REPORTS: "sippakades_mock_reports_v1",
  SERVICES: "sippakades_mock_services_v1",
  INCOMING: "sippakades_mock_incoming_v1",
  OUTGOING: "sippakades_mock_outgoing_v1",
  USERS: "sippakades_mock_users_v1",
  AUDIT: "sippakades_mock_audit_v1",
  BACKUP: "sippakades_mock_backup_v1",
};

const MASTER_DEFAULTS: Record<string, SimpleMasterItem[]> = {
  jabatan: INITIAL_MASTER_POSITIONS,
  "kategori-potensi": INITIAL_POTENTIAL_CATEGORIES,
  "kategori-wisata": INITIAL_TOURISM_CATEGORIES,
  "jenis-laporan": INITIAL_REPORT_TYPES,
  "periode-laporan": INITIAL_REPORT_PERIODS,
  "jenis-layanan": INITIAL_SERVICE_TYPES_MASTER,
  "klasifikasi-surat": INITIAL_LETTER_CLASSIFICATIONS,
};

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function maskNik(nik: string): string {
  const clean = nik.trim();
  if (clean.length < 8) return "******";
  return `${clean.slice(0, 6)}******${clean.slice(-4)}`;
}

function appendAudit(
  user: UserProfile | null,
  action: AuditLogItem["action"],
  entityType: string,
  entityId: string,
  summary: string
) {
  const list = readLS<AuditLogItem[]>(ADMIN_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  const entry: AuditLogItem = {
    id: uuid(),
    district_id: user?.district_id ?? DISTRICT_LAEYA_ID,
    user_name: user?.full_name ?? "System",
    role: user?.role ?? "superadmin_kab",
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    ip_address: "127.0.0.1",
    created_at: new Date().toISOString(),
  };
  writeLS(ADMIN_KEYS.AUDIT, [entry, ...list].slice(0, 200));
}

export async function handleAdminExtendedMock<T>(
  pathname: string,
  params: URLSearchParams,
  httpMethod: string,
  body: unknown,
  currentUser: UserProfile | null
): Promise<T | null> {
  if (!currentUser) {
    throw new Error("Sesi tidak valid atau telah berakhir.");
  }

  // 1. Generic 7 Master Modules
  const masterMatch = pathname.match(
    /^\/api\/v1\/admin\/master\/(jabatan|kategori-potensi|kategori-wisata|jenis-laporan|periode-laporan|jenis-layanan|klasifikasi-surat)\/(read|option|detail\/[^/]+|create|update\/[^/]+|delete\/[^/]+)$/
  );
  if (masterMatch) {
    const [, slug, action] = masterMatch;
    const key = ADMIN_KEYS[slug];
    const items = readLS<SimpleMasterItem[]>(key, MASTER_DEFAULTS[slug]);

    if (action === "read" && httpMethod === "GET") {
      const search = (params.get("search") ?? "").trim().toLowerCase();
      const skip = Number(params.get("skip") ?? 0);
      const limit = Number(params.get("limit") ?? 10);
      const filtered = search
        ? items.filter(
            (i) =>
              i.name.toLowerCase().includes(search) ||
              i.code.toLowerCase().includes(search)
          )
        : items;
      return {
        total: filtered.length,
        skip,
        limit,
        data: filtered.slice(skip, skip + limit),
      } as T;
    }

    if (action === "option" && httpMethod === "GET") {
      const opts: OptionItem[] = items
        .filter((i) => i.is_active)
        .map((i) => ({
          id: i.id,
          label: i.name,
          code: i.code,
          meta: {
            level: i.level,
            default_unit: i.default_unit,
            sla_days: i.sla_days,
            period_year: i.period_year,
            period_quarter: i.period_quarter,
          },
        }));
      return opts as T;
    }

    if (action === "create" && httpMethod === "POST") {
      const input = body as Partial<SimpleMasterItem>;
      if (items.some((i) => i.code.toLowerCase() === (input.code ?? "").toLowerCase())) {
        throw new Error(`Kode "${input.code}" sudah digunakan.`);
      }
      const now = new Date().toISOString();
      const created: SimpleMasterItem = {
        id: uuid(),
        code: input.code ?? "",
        name: input.name ?? "",
        description: input.description ?? null,
        is_active: input.is_active ?? true,
        level: input.level,
        sort_order: input.sort_order,
        default_unit: input.default_unit,
        sla_days: input.sla_days,
        period_year: input.period_year,
        period_quarter: input.period_quarter,
        deadline_at: input.deadline_at,
        is_open: input.is_open,
        created_at: now,
        updated_at: now,
      };
      writeLS(key, [created, ...items]);
      appendAudit(currentUser, "CREATE", `master_${slug}`, created.id, `Menambah ${created.name}`);
      return { success: true, message: "Data master ditambahkan", data: created } as T;
    }

    if (action.startsWith("update/") && httpMethod === "PUT") {
      const id = action.split("/")[1];
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Data tidak ditemukan.");
      const updated = {
        ...items[idx],
        ...(body as Partial<SimpleMasterItem>),
        updated_at: new Date().toISOString(),
      };
      items[idx] = updated;
      writeLS(key, items);
      appendAudit(currentUser, "UPDATE", `master_${slug}`, id, `Memperbarui ${updated.name}`);
      return { success: true, message: "Data master diperbarui", data: updated } as T;
    }

    if (action.startsWith("delete/") && httpMethod === "DELETE") {
      const id = action.split("/")[1];
      writeLS(
        key,
        items.filter((i) => i.id !== id)
      );
      appendAudit(currentUser, "DELETE", `master_${slug}`, id, `Menghapus master ${slug}`);
      return { success: true, message: "Data master dihapus", data: { id } } as T;
    }
  }

  // 2. Pemerintahan: Perangkat
  if (pathname.startsWith("/api/v1/admin/pemerintahan/perangkat/")) {
    const items = readLS<OfficialItem[]>(ADMIN_KEYS.OFFICIALS, INITIAL_OFFICIALS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      const search = (params.get("search") ?? "").toLowerCase();
      const skip = Number(params.get("skip") ?? 0);
      const limit = Number(params.get("limit") ?? 10);
      const scoped = items.filter((o) => {
        if (currentUser.role === "operator_desa") return o.village_id === currentUser.village_id;
        if (currentUser.role !== "superadmin_kab" && currentUser.district_id)
          return o.district_id === currentUser.district_id;
        return true;
      });
      const filtered = search
        ? scoped.filter(
            (o) =>
              o.full_name.toLowerCase().includes(search) ||
              o.position_name.toLowerCase().includes(search)
          )
        : scoped;
      return { total: filtered.length, skip, limit, data: filtered.slice(skip, skip + limit) } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const inp = body as Partial<OfficialItem>;
      const created: OfficialItem = {
        id: uuid(),
        district_id: currentUser.district_id ?? inp.district_id ?? DISTRICT_LAEYA_ID,
        district_name: "Laeya",
        village_id: currentUser.role === "operator_desa" ? currentUser.village_id : (inp.village_id || null),
        village_name: inp.village_name ?? (inp.village_id ? "Desa/Kelurahan" : "Kantor Kecamatan"),
        position_id: inp.position_id ?? "pos-kades",
        position_name: inp.position_name ?? "Perangkat",
        full_name: inp.full_name ?? "",
        nip: inp.nip ?? null,
        sk_number: inp.sk_number ?? null,
        phone: inp.phone ?? null,
        photo_url: null,
        is_active: inp.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
      writeLS(ADMIN_KEYS.OFFICIALS, [created, ...items]);
      return { success: true, message: "Perangkat ditambahkan", data: created } as T;
    }
    if (pathname.includes("/update/") && httpMethod === "PUT") {
      const id = pathname.split("/").pop() ?? "";
      const idx = items.findIndex((o) => o.id === id);
      if (idx === -1) throw new Error("Perangkat tidak ditemukan.");
      items[idx] = { ...items[idx], ...(body as Partial<OfficialItem>), updated_at: new Date().toISOString() };
      writeLS(ADMIN_KEYS.OFFICIALS, items);
      return { success: true, message: "Perangkat diperbarui", data: items[idx] } as T;
    }
    if (pathname.includes("/delete/") && httpMethod === "DELETE") {
      const id = pathname.split("/").pop() ?? "";
      writeLS(ADMIN_KEYS.OFFICIALS, items.filter((o) => o.id !== id));
      return { success: true, message: "Perangkat dihapus", data: { id } } as T;
    }
  }

  // 3. Pemerintahan: Potensi & Wisata + Publikasi Berita & Regulasi
  if (pathname.startsWith("/api/v1/admin/pemerintahan/potensi/")) {
    const items = readLS(ADMIN_KEYS.POTENTIALS, MOCK_POTENTIALS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      const search = (params.get("search") ?? "").toLowerCase();
      const filtered = search
        ? items.filter((p) => p.title.toLowerCase().includes(search) || p.village_name.toLowerCase().includes(search))
        : items;
      return { total: filtered.length, skip: 0, limit: 20, data: filtered } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const created = { ...(body as any), id: uuid(), district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID };
      writeLS(ADMIN_KEYS.POTENTIALS, [created, ...items]);
      return { success: true, message: "Potensi ditambahkan", data: created } as T;
    }
    if (pathname.includes("/delete/") && httpMethod === "DELETE") {
      const id = pathname.split("/").pop() ?? "";
      writeLS(ADMIN_KEYS.POTENTIALS, items.filter((p) => p.id !== id));
      return { success: true, message: "Potensi dihapus", data: { id } } as T;
    }
  }

  if (pathname.startsWith("/api/v1/admin/pemerintahan/wisata/")) {
    const items = readLS(ADMIN_KEYS.TOURISM, MOCK_TOURISM);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      const search = (params.get("search") ?? "").toLowerCase();
      const filtered = search
        ? items.filter((t) => t.name.toLowerCase().includes(search) || t.village_name.toLowerCase().includes(search))
        : items;
      return { total: filtered.length, skip: 0, limit: 20, data: filtered } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const created = { ...(body as any), id: uuid(), district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID };
      writeLS(ADMIN_KEYS.TOURISM, [created, ...items]);
      return { success: true, message: "Destinasi wisata ditambahkan", data: created } as T;
    }
    if (pathname.includes("/delete/") && httpMethod === "DELETE") {
      const id = pathname.split("/").pop() ?? "";
      writeLS(ADMIN_KEYS.TOURISM, items.filter((t) => t.id !== id));
      return { success: true, message: "Destinasi wisata dihapus", data: { id } } as T;
    }
  }

  if (pathname.startsWith("/api/v1/admin/publikasi/berita/")) {
    const items = readLS(ADMIN_KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      return { total: items.length, skip: 0, limit: 20, data: items } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const created = {
        ...(body as any),
        id: uuid(),
        district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID,
        slug: ((body as any).title ?? "berita").toLowerCase().replace(/\s+/g, "-"),
        published_at: new Date().toISOString(),
      };
      writeLS(ADMIN_KEYS.ANNOUNCEMENTS, [created, ...items]);
      return { success: true, message: "Berita dipublikasikan", data: created } as T;
    }
    if (pathname.includes("/delete/") && httpMethod === "DELETE") {
      const id = pathname.split("/").pop() ?? "";
      writeLS(ADMIN_KEYS.ANNOUNCEMENTS, items.filter((a) => a.id !== id));
      return { success: true, message: "Berita dihapus", data: { id } } as T;
    }
  }

  if (pathname.startsWith("/api/v1/admin/publikasi/regulasi/")) {
    const items = readLS(ADMIN_KEYS.REGULATIONS, MOCK_REGULATIONS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      return { total: items.length, skip: 0, limit: 20, data: items } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const created = { ...(body as any), id: uuid(), district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID };
      writeLS(ADMIN_KEYS.REGULATIONS, [created, ...items]);
      return { success: true, message: "Regulasi ditambahkan", data: created } as T;
    }
    if (pathname.includes("/delete/") && httpMethod === "DELETE") {
      const id = pathname.split("/").pop() ?? "";
      writeLS(ADMIN_KEYS.REGULATIONS, items.filter((r) => r.id !== id));
      return { success: true, message: "Regulasi dihapus", data: { id } } as T;
    }
  }

  // 4. Pelaporan Triwulanan
  if (pathname.startsWith("/api/v1/admin/pelaporan/triwulan/")) {
    const reports = readLS<QuarterlyReportItem[]>(ADMIN_KEYS.REPORTS, INITIAL_REPORTS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      const search = (params.get("search") ?? "").toLowerCase();
      const status = params.get("status") ?? "";
      const villageId = params.get("village_id") ?? "";
      const skip = Number(params.get("skip") ?? 0);
      const limit = Number(params.get("limit") ?? 10);

      let scoped = reports.filter((r) => {
        if (currentUser.role === "operator_desa") return r.village_id === currentUser.village_id;
        if (currentUser.role !== "superadmin_kab" && currentUser.district_id)
          return r.district_id === currentUser.district_id;
        return true;
      });
      if (status) scoped = scoped.filter((r) => r.status === status);
      if (villageId) scoped = scoped.filter((r) => r.village_id === villageId);
      if (search) {
        scoped = scoped.filter(
          (r) =>
            r.title.toLowerCase().includes(search) ||
            r.village_name.toLowerCase().includes(search) ||
            r.report_type_name.toLowerCase().includes(search)
        );
      }
      return { total: scoped.length, skip, limit, data: scoped.slice(skip, skip + limit) } as T;
    }

    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const inp = body as {
        village_id?: string;
        report_type_id: string;
        period_id: string;
        title: string;
        summary_payload?: Record<string, string | number>;
      };
      const targetVillageId =
        currentUser.role === "operator_desa"
          ? currentUser.village_id ?? ""
          : inp.village_id ?? VILLAGE_PUUNGGALUKU_ID;
      const village = INITIAL_VILLAGES.find((v) => v.id === targetVillageId);
      const rType = INITIAL_REPORT_TYPES.find((t) => t.id === inp.report_type_id);
      const period = INITIAL_REPORT_PERIODS.find((p) => p.id === inp.period_id);
      const now = new Date().toISOString();

      const created: QuarterlyReportItem = {
        id: uuid(),
        district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID,
        village_id: targetVillageId,
        village_name: village ? `${village.type === "kelurahan" ? "Kel." : "Desa"} ${village.name}` : "Wilayah",
        report_type_id: inp.report_type_id,
        report_type_name: rType?.name ?? "Laporan Triwulanan",
        period_id: inp.period_id,
        period_year: period?.period_year ?? 2026,
        period_quarter: period?.period_quarter ?? 4,
        period_label: period?.name ?? "TW IV 2026",
        title: inp.title,
        status: "draf",
        submission_version: 1,
        submitted_at: null,
        revision_note: null,
        summary_payload: inp.summary_payload ?? {},
        attachments: [],
        histories: [
          {
            from_status: null,
            to_status: "draf",
            note: "Draf laporan dibuat",
            changed_by_name: currentUser.full_name,
            changed_at: now,
            submission_version: 1,
          },
        ],
        created_by_name: currentUser.full_name,
        verified_by_name: null,
        updated_at: now,
      };
      writeLS(ADMIN_KEYS.REPORTS, [created, ...reports]);
      appendAudit(currentUser, "CREATE", "quarterly_reports", created.id, `Membuat draf ${created.title}`);
      return { success: true, message: "Draf laporan disimpan", data: created } as T;
    }

    const submitMatch = pathname.match(/\/triwulan\/([^/]+)\/submit$/);
    if (submitMatch && httpMethod === "POST") {
      const id = submitMatch[1];
      const idx = reports.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Laporan tidak ditemukan.");
      const target = reports[idx];
      if (target.status !== "draf" && target.status !== "perlu_perbaikan") {
        throw new Error("Laporan sedang terkunci atau sudah terverifikasi.");
      }
      const nextVersion = target.status === "perlu_perbaikan" ? target.submission_version + 1 : target.submission_version;
      const now = new Date().toISOString();
      target.histories.push({
        from_status: target.status,
        to_status: "diajukan",
        note: "Diajukan ke verifikator kecamatan",
        changed_by_name: currentUser.full_name,
        changed_at: now,
        submission_version: nextVersion,
      });
      target.status = "diajukan";
      target.submission_version = nextVersion;
      target.submitted_at = now;
      target.updated_at = now;
      writeLS(ADMIN_KEYS.REPORTS, reports);
      appendAudit(currentUser, "STATUS_CHANGE", "quarterly_reports", id, `Mengajukan laporan v${nextVersion}`);
      return { success: true, message: "Laporan berhasil diajukan ke Kecamatan", data: target } as T;
    }

    const verifyMatch = pathname.match(/\/triwulan\/([^/]+)\/verify$/);
    if (verifyMatch && httpMethod === "POST") {
      if (currentUser.role === "operator_desa") {
        throw new Error("Operator desa tidak berwenang memverifikasi laporan.");
      }
      const id = verifyMatch[1];
      const idx = reports.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Laporan tidak ditemukan.");
      const target = reports[idx];
      if (target.status !== "diajukan") {
        throw new Error("Hanya laporan berstatus Diajukan yang dapat diverifikasi.");
      }
      const { decision, note } = body as { decision: "terverifikasi" | "perlu_perbaikan"; note?: string };
      if (decision === "perlu_perbaikan" && !note?.trim()) {
        throw new Error("Catatan perbaikan wajib diisi saat mengembalikan laporan.");
      }
      const now = new Date().toISOString();
      target.histories.push({
        from_status: "diajukan",
        to_status: decision,
        note: note?.trim() || "Laporan terverifikasi",
        changed_by_name: currentUser.full_name,
        changed_at: now,
        submission_version: target.submission_version,
      });
      target.status = decision;
      target.revision_note = decision === "perlu_perbaikan" ? (note ?? "") : null;
      target.verified_by_name = decision === "terverifikasi" ? currentUser.full_name : null;
      target.updated_at = now;
      writeLS(ADMIN_KEYS.REPORTS, reports);
      appendAudit(currentUser, "STATUS_CHANGE", "quarterly_reports", id, `Verifikasi -> ${decision}`);
      return { success: true, message: `Status diperbarui menjadi ${decision}`, data: target } as T;
    }
  }

  // 5. Pelayanan Administrasi SIP-PAKADES
  if (pathname.startsWith("/api/v1/admin/pelayanan/")) {
    const list = readLS<ServiceRequestItem[]>(ADMIN_KEYS.SERVICES, INITIAL_SERVICE_REQUESTS);
    if (pathname === "/api/v1/admin/pelayanan/permohonan/read" && httpMethod === "GET") {
      const search = (params.get("search") ?? "").toLowerCase();
      const status = params.get("status") ?? "";
      const skip = Number(params.get("skip") ?? 0);
      const limit = Number(params.get("limit") ?? 10);
      let scoped = list.filter((s) => {
        if (currentUser.role === "operator_desa") return s.village_id === currentUser.village_id;
        if (currentUser.role !== "superadmin_kab" && currentUser.district_id)
          return s.district_id === currentUser.district_id;
        return true;
      });
      if (status) scoped = scoped.filter((s) => s.status === status);
      if (search) {
        scoped = scoped.filter(
          (s) =>
            s.registration_number.toLowerCase().includes(search) ||
            s.applicant_name.toLowerCase().includes(search) ||
            s.service_type_name.toLowerCase().includes(search)
        );
      }
      return { total: scoped.length, skip, limit, data: scoped.slice(skip, skip + limit) } as T;
    }

    if (pathname === "/api/v1/admin/pelayanan/permohonan/create" && httpMethod === "POST") {
      const inp = body as {
        village_id?: string;
        service_type_id: string;
        applicant_name: string;
        applicant_nik: string;
        applicant_phone: string;
        applicant_address: string;
        village_cover_letter_no?: string;
        notes?: string;
      };
      const targetVillageId =
        currentUser.role === "operator_desa"
          ? currentUser.village_id ?? ""
          : inp.village_id ?? VILLAGE_PUUNGGALUKU_ID;
      const village = INITIAL_VILLAGES.find((v) => v.id === targetVillageId);
      const srvType = INITIAL_SERVICE_TYPES_MASTER.find((t) => t.id === inp.service_type_id);
      const now = new Date();
      const slaDays = srvType?.sla_days ?? 3;
      const due = new Date(now.getTime() + slaDays * 86400000).toISOString();
      const regNo = `SIP-740511-${now.getFullYear()}-${String(list.length + 43).padStart(4, "0")}`;

      const created: ServiceRequestItem = {
        id: uuid(),
        registration_number: regNo,
        district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID,
        village_id: targetVillageId,
        village_name: village ? `${village.type === "kelurahan" ? "Kel." : "Desa"} ${village.name}` : "Wilayah",
        service_type_id: inp.service_type_id,
        service_type_name: srvType?.name ?? "Layanan SIP-PAKADES",
        applicant_name: inp.applicant_name,
        applicant_nik_masked: maskNik(inp.applicant_nik),
        applicant_phone: inp.applicant_phone,
        applicant_address: inp.applicant_address,
        village_cover_letter_no: inp.village_cover_letter_no ?? null,
        status: "diterima",
        sla_days: slaDays,
        sla_due_at: due,
        notes: inp.notes ?? null,
        documents: [],
        histories: [
          {
            status: "diterima",
            note: "Permohonan didaftarkan",
            public_note: "Permohonan layanan telah diterima di sistem.",
            changed_by_name: currentUser.full_name,
            changed_at: now.toISOString(),
          },
        ],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      writeLS(ADMIN_KEYS.SERVICES, [created, ...list]);
      appendAudit(currentUser, "CREATE", "service_requests", created.id, `Registrasi ${regNo}`);
      return { success: true, message: `Permohonan ${regNo} terdaftar`, data: created } as T;
    }

    const statusMatch = pathname.match(/\/permohonan\/([^/]+)\/status$/);
    if (statusMatch && httpMethod === "PATCH") {
      if (currentUser.role === "operator_desa") {
        throw new Error("Hanya petugas kecamatan yang dapat memproses status layanan SIP-PAKADES.");
      }
      const id = statusMatch[1];
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error("Permohonan tidak ditemukan.");
      const { status, note } = body as { status: ServiceRequestItem["status"]; note?: string };
      if (status === "perlu_kelengkapan" && !note?.trim()) {
        throw new Error("Catatan kekurangan berkas wajib diisi.");
      }
      const now = new Date().toISOString();
      list[idx].status = status;
      list[idx].updated_at = now;
      list[idx].histories.push({
        status,
        note: note?.trim() || `Status diubah menjadi ${status}`,
        public_note: note?.trim() || `Status permohonan: ${status.replace("_", " ")}`,
        changed_by_name: currentUser.full_name,
        changed_at: now,
      });
      writeLS(ADMIN_KEYS.SERVICES, list);
      appendAudit(currentUser, "STATUS_CHANGE", "service_requests", id, `Status PATEN -> ${status}`);
      return { success: true, message: "Status pelayanan diperbarui", data: list[idx] } as T;
    }
  }

  // 6. Persuratan
  if (pathname.startsWith("/api/v1/admin/persuratan/surat-masuk/")) {
    const items = readLS<IncomingLetterItem[]>(ADMIN_KEYS.INCOMING, INITIAL_INCOMING_LETTERS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      return { total: items.length, skip: 0, limit: 20, data: items } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const inp = body as Partial<IncomingLetterItem>;
      const created: IncomingLetterItem = {
        id: uuid(),
        district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID,
        source_village_id: inp.source_village_id ?? null,
        source_village_name: inp.source_village_name ?? "Eksternal",
        classification_id: inp.classification_id ?? "cls-140",
        classification_code: inp.classification_code ?? "140",
        agenda_number: inp.agenda_number ?? `AGD-2026-${String(items.length + 90).padStart(3, "0")}`,
        origin_letter_number: inp.origin_letter_number ?? "",
        origin_sender: inp.origin_sender ?? "",
        letter_date: inp.letter_date ?? new Date().toISOString().slice(0, 10),
        received_date: inp.received_date ?? new Date().toISOString().slice(0, 10),
        subject: inp.subject ?? "",
        urgency: inp.urgency ?? "biasa",
        disposition_status: "baru",
        dispositions: [],
      };
      writeLS(ADMIN_KEYS.INCOMING, [created, ...items]);
      return { success: true, message: "Surat masuk dicatat", data: created } as T;
    }
    const dispMatch = pathname.match(/\/surat-masuk\/([^/]+)\/dispositions$/);
    if (dispMatch && httpMethod === "POST") {
      const id = dispMatch[1];
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error("Surat masuk tidak ditemukan.");
      const { instruction, target_user_name } = body as { instruction: string; target_user_name?: string };
      items[idx].disposition_status = "didisposisikan";
      items[idx].dispositions.push({
        id: uuid(),
        target_user_id: "770e8400-e29b-41d4-a716-446655440004",
        target_user_name: target_user_name ?? "Kasi Pelayanan",
        instruction,
        status: "didisposisikan",
        action_note: null,
        created_at: new Date().toISOString(),
      });
      writeLS(ADMIN_KEYS.INCOMING, items);
      return { success: true, message: "Disposisi dikirim", data: items[idx] } as T;
    }
  }

  if (pathname.startsWith("/api/v1/admin/persuratan/surat-keluar/")) {
    const items = readLS<OutgoingLetterItem[]>(ADMIN_KEYS.OUTGOING, INITIAL_OUTGOING_LETTERS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      return { total: items.length, skip: 0, limit: 20, data: items } as T;
    }
    if (pathname.endsWith("/next-number") && httpMethod === "GET") {
      const code = params.get("classification_code") ?? "140";
      const seq = items.length + 42;
      return {
        success: true,
        message: "OK",
        data: { letter_number: `${code}/${String(seq).padStart(3, "0")}/KEC-LAEYA/XI/2026`, sequence_number: seq },
      } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const inp = body as Partial<OutgoingLetterItem>;
      const seq = items.length + 42;
      const clsCode = inp.classification_code ?? "140";
      const created: OutgoingLetterItem = {
        id: uuid(),
        district_id: currentUser.district_id ?? DISTRICT_LAEYA_ID,
        target_village_id: inp.target_village_id ?? null,
        classification_id: inp.classification_id ?? "cls-140",
        classification_code: clsCode,
        letter_number: inp.letter_number || `${clsCode}/${String(seq).padStart(3, "0")}/KEC-LAEYA/XI/2026`,
        letter_type: inp.letter_type ?? "rekomendasi",
        recipient: inp.recipient ?? "",
        letter_date: inp.letter_date ?? new Date().toISOString().slice(0, 10),
        subject: inp.subject ?? "",
        service_request_id: inp.service_request_id ?? null,
        created_at: new Date().toISOString(),
      };
      writeLS(ADMIN_KEYS.OUTGOING, [created, ...items]);
      return { success: true, message: "Surat keluar dicatat", data: created } as T;
    }
  }

  // 7. Pemantauan 3 Pilar
  if (pathname.startsWith("/api/v1/admin/pemantauan/")) {
    const reports = readLS<QuarterlyReportItem[]>(ADMIN_KEYS.REPORTS, INITIAL_REPORTS);
    const services = readLS<ServiceRequestItem[]>(ADMIN_KEYS.SERVICES, INITIAL_SERVICE_REQUESTS);
    const incoming = readLS<IncomingLetterItem[]>(ADMIN_KEYS.INCOMING, INITIAL_INCOMING_LETTERS);
    const outgoing = readLS<OutgoingLetterItem[]>(ADMIN_KEYS.OUTGOING, INITIAL_OUTGOING_LETTERS);
    const targetDistrictId = params.get("district_id") || currentUser.district_id || DISTRICT_LAEYA_ID;
    const villages = INITIAL_VILLAGES.filter((v) => v.district_id === targetDistrictId);

    if (pathname.endsWith("/summary") && httpMethod === "GET") {
      return {
        success: true,
        message: "OK",
        data: {
          active_villages_count: villages.length,
          avg_completeness_pct: villages.length > 0 ? 86.4 : 0,
          reports_on_time_count: reports.filter((r) => r.status === "terverifikasi" || r.status === "diajukan").length,
          reports_late_count: 0,
          reports_pending_count: reports.filter((r) => r.status === "perlu_perbaikan" || r.status === "draf").length,
          services_total: services.length,
          services_completed: services.filter((s) => s.status === "selesai").length,
          services_sla_compliance_pct: 100,
          incoming_letters_count: incoming.length,
          outgoing_letters_count: outgoing.length,
        },
      } as T;
    }

    if (pathname.endsWith("/completeness") && httpMethod === "GET") {
      const rows: CompletenessRow[] = villages.map((v, idx) => {
        const hasPot = idx < 5;
        const hasTour = idx === 11 || idx === 9 || idx === 15;
        const pct = Math.min(100, 75 + (hasPot ? 15 : 0) + (hasTour ? 10 : 0));
        return {
          village_id: v.id,
          village_name: `${v.type === "kelurahan" ? "Kel." : "Desa"} ${v.name}`,
          village_type: v.type,
          has_profile: true,
          officials_count: 3,
          potentials_count: hasPot ? 1 : 0,
          tourism_count: hasTour ? 1 : 0,
          completeness_pct: pct,
          missing_items: pct < 100 ? ["Destinasi Wisata / Potensi Tambahan"] : [],
        };
      });
      return { total: rows.length, skip: 0, limit: 50, data: rows } as T;
    }

    if (pathname.endsWith("/timeliness") && httpMethod === "GET") {
      const rows: TimelinessRow[] = villages.map((v) => {
        const rep = reports.find((r) => r.village_id === v.id && r.period_quarter === 4);
        return {
          village_id: v.id,
          village_name: `${v.type === "kelurahan" ? "Kel." : "Desa"} ${v.name}`,
          report_type_id: rep?.report_type_id ?? "rt-lppd",
          report_type_name: rep?.report_type_name ?? "LPPD Triwulanan",
          period_label: "TW IV 2026",
          deadline_at: "2027-01-15T16:00:00Z",
          submitted_at: rep?.submitted_at ?? null,
          report_status: rep?.status ?? "belum_ada",
          timeliness_status: !rep
            ? "belum_lapor"
            : rep.status === "perlu_perbaikan"
              ? "perlu_perbaikan"
              : "tepat_waktu",
          delay_days: 0,
        };
      });
      return { total: rows.length, skip: 0, limit: 50, data: rows } as T;
    }
  }

  // 8. Sistem: Pengguna, Audit Log, Pencadangan
  if (pathname.startsWith("/api/v1/admin/sistem/pengguna/")) {
    const users = readLS<UserProfile[]>(ADMIN_KEYS.USERS, MOCK_USERS);
    if (pathname.endsWith("/read") && httpMethod === "GET") {
      const scoped =
        currentUser.role === "superadmin_kab"
          ? users
          : users.filter((u) => u.district_id === currentUser.district_id);
      return { total: scoped.length, skip: 0, limit: 50, data: scoped } as T;
    }
    if (pathname.endsWith("/create") && httpMethod === "POST") {
      const inp = body as Partial<UserProfile>;
      const d = INITIAL_DISTRICTS.find((x) => x.id === inp.district_id);
      const v = INITIAL_VILLAGES.find((x) => x.id === inp.village_id);
      const created: UserProfile = {
        id: uuid(),
        username: inp.username ?? "",
        full_name: inp.full_name ?? "",
        email: inp.email ?? "",
        phone: inp.phone ?? null,
        nip: inp.nip ?? null,
        role: inp.role ?? "operator_desa",
        role_label: inp.role ?? "operator_desa",
        district_id: inp.district_id ?? currentUser.district_id,
        district_name: d?.name ?? currentUser.district_name ?? "Laeya",
        village_id: inp.village_id ?? null,
        village_name: v?.name ?? null,
        avatar_url: null,
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
      };
      writeLS(ADMIN_KEYS.USERS, [created, ...users]);
      appendAudit(currentUser, "CREATE", "users", created.id, `Menambah user ${created.username}`);
      return { success: true, message: "Pengguna ditambahkan", data: created } as T;
    }
  }

  if (pathname === "/api/v1/admin/sistem/audit-log/read" && httpMethod === "GET") {
    const list = readLS<AuditLogItem[]>(ADMIN_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    return { total: list.length, skip: 0, limit: 50, data: list } as T;
  }

  if (pathname === "/api/v1/admin/sistem/pencadangan/read" && httpMethod === "GET") {
    const list = readLS<BackupLogItem[]>(ADMIN_KEYS.BACKUP, INITIAL_BACKUP_LOGS);
    return { total: list.length, skip: 0, limit: 20, data: list } as T;
  }

  if (pathname === "/api/v1/admin/sistem/pencadangan/trigger" && httpMethod === "POST") {
    const list = readLS<BackupLogItem[]>(ADMIN_KEYS.BACKUP, INITIAL_BACKUP_LOGS);
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const created: BackupLogItem = {
      id: uuid(),
      file_name: `sippakades_manual_${stamp}.sql.gz`,
      file_size_bytes: 1924800,
      status: "success",
      triggered_by_name: currentUser.full_name,
      started_at: now.toISOString(),
      finished_at: now.toISOString(),
      notes: "Backup manual berhasil dijalankan.",
    };
    writeLS(ADMIN_KEYS.BACKUP, [created, ...list]);
    appendAudit(currentUser, "BACKUP", "backup_logs", created.id, `Trigger backup ${created.file_name}`);
    return { success: true, message: "Backup database berhasil dibuat", data: created } as T;
  }

  return null;
}
