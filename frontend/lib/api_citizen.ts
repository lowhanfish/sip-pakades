/**
 * Klien API khusus portal warga.
 * Sesi warga memakai cookie terpisah dari petugas (citizen_*), jadi tidak memakai fetchData milik admin.
 * Portal warga selalu memakai backend sungguhan (tidak ada mode mock).
 */
const AUTH_BASE = "/api/v1/masyarakat/auth";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export class CitizenApiError extends Error {
  status: number;
  fieldErrors: Array<{ field: string; message: string }>;
  constructor(message: string, status: number, fieldErrors: Array<{ field: string; message: string }> = []) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${AUTH_BASE}/refresh`, { method: "POST", credentials: "include" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export interface CitizenFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Jangan coba memperbarui sesi saat 401 (dipakai untuk pengecekan sesi & login). */
  noRefresh?: boolean;
}

export async function citizenFetch<T>(
  path: string,
  { method = "GET", body, noRefresh = false }: CitizenFetchOptions = {}
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const csrf = readCookie("citizen_csrf_token");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(path, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 401 && !noRefresh && (await refreshSession())) {
    return citizenFetch<T>(path, { method, body, noRefresh: true });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data as { message?: string; detail?: string; errors?: Array<{ field: string; message: string }> } | null;
    throw new CitizenApiError(
      err?.message || err?.detail || `Terjadi kesalahan (HTTP ${res.status})`,
      res.status,
      Array.isArray(err?.errors) ? err.errors : []
    );
  }
  return data as T;
}

export const CITIZEN_API = {
  register: `${AUTH_BASE}/register`,
  login: `${AUTH_BASE}/login`,
  logout: `${AUTH_BASE}/logout`,
  me: `${AUTH_BASE}/me`,
  profile: `${AUTH_BASE}/profile`,
  changePassword: `${AUTH_BASE}/change-password`,
  services: "/api/v1/masyarakat/layanan",
  requests: "/api/v1/masyarakat/permohonan",
};
