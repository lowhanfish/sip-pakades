export function calculateSkip(page: number, limit: number): number {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  return (safePage - 1) * safeLimit;
}

export function calculateTotalPages(total: number, limit: number): number {
  if (total <= 0 || limit <= 0) return 1;
  return Math.ceil(total / limit);
}

export function formatQuarterLabel(year: number, quarter: number): string {
  const roman = ["I", "II", "III", "IV"][quarter - 1] ?? String(quarter);
  return `TW ${roman} ${year}`;
}

export function formatDateId(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeId(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
