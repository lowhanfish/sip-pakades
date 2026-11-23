import { useUrlStore } from "@/store/useUrlStore";
import { handleMockRequest, isMockMode } from "@/lib/mock";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

let refreshPromise: Promise<void> | null = null;

export interface FetchOption extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export const fetchData = async <T>(
  url: string,
  option: FetchOption = {},
  shouldRetry = true
): Promise<T> => {
  const { method, headers, ...otherOption } = option;
  const httpMethod = (method ?? "GET").toUpperCase();

  if (isMockMode()) {
    return handleMockRequest<T>(url, httpMethod, otherOption.body);
  }

  const isFormData =
    typeof FormData !== "undefined" && otherOption.body instanceof FormData;

  const headerObj: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((headers as Record<string, string>) ?? {}),
  };

  if (
    typeof window !== "undefined" &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(httpMethod)
  ) {
    const csrfToken = getCookie("csrf_token");
    if (csrfToken && !headerObj["X-CSRF-Token"]) {
      headerObj["X-CSRF-Token"] = csrfToken;
    }
  }

  const rawBody = otherOption.body;
  const processedBody =
    isFormData || typeof rawBody === "string" || rawBody == null
      ? (rawBody as BodyInit | null | undefined)
      : JSON.stringify(rawBody);

  const res = await fetch(url, {
    ...otherOption,
    body: processedBody,
    method: httpMethod,
    credentials: "include",
    headers: headerObj,
  });

  if (res.status === 401 && shouldRetry) {
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" || window.location.pathname === "/")
    ) {
      throw new Error("Sesi belum terautentikasi.");
    }

    await refreshData();
    return fetchData<T>(url, option, false);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errObj = data as {
      message?: string;
      detail?: string;
      errors?: Array<{ message?: string }>;
    } | null;
    const errorMessage =
      errObj?.message ||
      errObj?.detail ||
      (Array.isArray(errObj?.errors) && errObj.errors.length > 0
        ? errObj.errors[0]?.message
        : null) ||
      `Terjadi kesalahan HTTP dengan status: ${res.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
};

const refreshData = async (): Promise<void> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshUrl = useUrlStore.getState().URL.REFRESH;
      const res = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Sesi berakhir, silakan login ulang.");
      }
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
