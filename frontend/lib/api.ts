import { ApiEnvelope } from "@/types/global";
import { handleMockRequest, isMockMode } from "@/lib/mock";

export type { ApiEnvelope };

export async function fetchPublic<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (isMockMode()) {
    return handleMockRequest<T>(url, method, init?.body);
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (data as { message?: string; detail?: string } | null)?.message ||
      (data as { detail?: string } | null)?.detail ||
      `HTTP Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
