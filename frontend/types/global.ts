export type RoleCode =
  | "superadmin_kab"
  | "admin_kecamatan"
  | "camat_sekcam"
  | "kasi_pelayanan"
  | "operator_desa";

export type VillageType = "desa" | "kelurahan";
export type OfficialLevel = "kecamatan" | "desa";
export type ReportStatus = "draf" | "diajukan" | "perlu_perbaikan" | "terverifikasi";
export type ServiceStatus = "diterima" | "perlu_kelengkapan" | "diproses" | "selesai";
export type LetterDirection = "masuk" | "keluar";
export type DispositionStatus = "baru" | "didisposisikan" | "ditindaklanjuti" | "selesai";
export type TimelinessStatus = "tepat_waktu" | "terlambat" | "perlu_perbaikan" | "belum_lapor";
export type PublicationStatus = "draf" | "terbit" | "arsip";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "DOWNLOAD_PRIVATE_DOC"
  | "EXPORT"
  | "BACKUP";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATUS_TRANSITION"
  | "LOCKED_RESOURCE"
  | "RATE_LIMITED"
  | "FILE_VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  total: number;
  skip: number;
  limit: number;
  data: T[];
}

export interface OptionItem<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  code?: string | null;
  meta?: TMeta;
}

export type ListOptionSchema = Array<{
  id: string;
  value: string;
  code?: string | null;
  meta?: Record<string, unknown>;
}>;

export interface FieldErrorItem {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCode;
  errors: FieldErrorItem[] | null;
}

export interface MenuItem {
  code: string;
  label: string;
  path: string;
  icon: string;
  children?: MenuItem[];
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  nip: string | null;
  role: RoleCode;
  role_label: string;
  district_id: string | null;
  district_name: string | null;
  village_id: string | null;
  village_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AuthSessionData {
  user: UserProfile;
  csrf_token: string;
  menus: MenuItem[];
}

export interface DistrictItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  office_address: string | null;
  phone: string | null;
  email: string | null;
  service_hours: string | null;
  vision: string | null;
  mission: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_default: boolean;
  village_count?: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VillageBoundaries {
  north: string | null;
  south: string | null;
  east: string | null;
  west: string | null;
}

export interface VillageItem {
  id: string;
  district_id: string;
  district_name?: string;
  code: string;
  name: string;
  slug: string;
  type: VillageType;
  description: string | null;
  history: string | null;
  boundaries: VillageBoundaries | null;
  area_km2: number | null;
  dusun_count: number;
  rw_count: number;
  rt_count: number;
  population_total: number;
  household_total: number;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}
