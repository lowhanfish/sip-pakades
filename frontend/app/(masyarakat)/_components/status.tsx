const STATUS_META: Record<string, { label: string; cls: string }> = {
  draf: { label: "Draf", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  diterima: { label: "Diterima", cls: "bg-sky-50 text-sky-800 border-sky-300" },
  diverifikasi: { label: "Terverifikasi", cls: "bg-sky-50 text-sky-800 border-sky-300" },
  perlu_kelengkapan: { label: "Perlu Kelengkapan", cls: "bg-orange-50 text-orange-800 border-orange-300" },
  perlu_perbaikan: { label: "Perlu Perbaikan", cls: "bg-orange-50 text-orange-800 border-orange-300" },
  diproses: { label: "Diproses", cls: "bg-blue-50 text-blue-800 border-blue-300" },
  menunggu_ttd: { label: "Menunggu Tanda Tangan", cls: "bg-blue-50 text-blue-800 border-blue-300" },
  selesai: { label: "Selesai", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  ditolak: { label: "Ditolak", cls: "bg-red-50 text-red-800 border-red-300" },
};

export function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: statusLabel(status), cls: "bg-slate-100 text-slate-700 border-slate-300" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
