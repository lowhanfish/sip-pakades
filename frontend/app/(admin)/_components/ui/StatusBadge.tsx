import React from "react";

const STATUS_STYLE_MAP: Record<string, string> = {
  // Active / Boolean
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-400/40",
  inactive: "bg-slate-500/15 text-slate-600 border-slate-400/40",
  default: "bg-yellow-300/60 text-slate-900 border-yellow-400/70",
  // VillageType
  kelurahan: "bg-sky-500/15 text-sky-700 border-sky-400/40",
  desa: "bg-teal-500/15 text-teal-700 border-teal-400/40",
  // Report & Service Status
  draf: "bg-slate-500/15 text-slate-600 border-slate-400/40",
  diajukan: "bg-sky-500/15 text-sky-700 border-sky-400/40",
  perlu_perbaikan: "bg-amber-500/20 text-amber-800 border-amber-400/50",
  terverifikasi: "bg-emerald-500/15 text-emerald-700 border-emerald-400/40",
  diterima: "bg-sky-500/15 text-sky-700 border-sky-400/40",
  perlu_kelengkapan: "bg-amber-500/20 text-amber-800 border-amber-400/50",
  diproses: "bg-indigo-500/15 text-indigo-700 border-indigo-400/40",
  selesai: "bg-emerald-500/15 text-emerald-700 border-emerald-400/40",
};

interface StatusBadgeProps {
  variant: string;
  label: string;
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const style =
    STATUS_STYLE_MAP[variant] ??
    "bg-sky-500/15 text-sky-700 border-sky-400/40";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}
    >
      {label}
    </span>
  );
}
