"use client";

import { useState } from "react";
import { BarChart3, Search, Sprout } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicPotentials } from "../hooks/usePublishData";

export default function PotensiWilayahPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const [search, setSearch] = useState("");
  const { data: res, isLoading } = usePublicPotentials(slug, search);

  const items = res?.data?.items ?? [];
  const chartSummary = res?.data?.chart_summary ?? [];
  const maxVal = Math.max(1, ...chartSummary.map((c) => c.total_value));

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-10 space-y-8">
      <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-4">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Sumber Daya &amp; Ekonomi Lokal
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Potensi Wilayah
          </h1>
          <p className="text-sm text-slate-600">
            Pemetaan komoditas unggulan pertanian, kelautan/perikanan, perkebunan,
            peternakan, dan UMKM desa/kelurahan.
          </p>
        </div>
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari potensi atau nama desa..."
            className="w-full rounded-xl border border-sky-200 bg-white/90 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>

      {/* Ringkasan Grafik Batang Kategori */}
      {chartSummary.length > 0 && (
        <Subtle3DCard className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Ringkasan Kapasitas per Sektor
            </h2>
          </div>
          <div className="space-y-3">
            {chartSummary.map((c) => {
              const pct = Math.max(12, Math.round((c.total_value / maxVal) * 100));
              return (
                <div key={c.category_name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{c.category_name}</span>
                    <span className="text-sky-800">
                      {c.total_value.toLocaleString("id-ID")} {c.unit}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-sky-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-yellow-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Subtle3DCard>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-xs text-slate-500">
          Memuat potensi wilayah...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center text-xs text-slate-600">
          Belum ada data potensi wilayah untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p, idx) => (
            <Subtle3DCard key={p.id} delay={idx * 0.04} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  <Sprout className="w-3 h-3" />
                  {p.category_name}
                </span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-yellow-200/90 text-slate-900">
                  {p.metric_value} {p.metric_unit}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {p.description}
              </p>
              <div className="text-[11px] font-semibold text-sky-700 pt-2 border-t border-sky-200/60">
                Lokasi: {p.village_name} • Tahun {p.period_year}
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
  );
}
