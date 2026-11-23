"use client";

import Image from "next/image";
import { useState } from "react";
import { BarChart3, Search, Sparkles, Sprout } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { Clay3DStatChart } from "@/components/three/Clay3DStatChart";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicPotentials } from "../hooks/usePublishData";

function getPotentialImage(title: string, category: string = ""): string {
  const s = `${title} ${category}`.toLowerCase();
  if (s.includes("ikan") || s.includes("laut") || s.includes("perikanan") || s.includes("tambak")) return "/img/potensi-perikanan.webp";
  if (s.includes("kebun") || s.includes("kakao") || s.includes("mete") || s.includes("kopi") || s.includes("lada")) return "/img/potensi-perkebunan.webp";
  return "/img/potensi-pertanian.webp";
}

const CATEGORY_COLORS: Record<string, string> = {
  Perikanan: "#0ea5e9",
  Pertanian: "#22c55e",
  Perkebunan: "#eab308",
  Peternakan: "#f97316",
  UMKM: "#a855f7",
};

export default function PotensiWilayahPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const [search, setSearch] = useState("");
  const { data: res, isLoading } = usePublicPotentials(slug, search);

  const items = res?.data?.items ?? [];
  const chartSummary = res?.data?.chart_summary ?? [];
  const maxVal = Math.max(1, ...chartSummary.map((c) => c.total_value));

  // Transform chart data for 3D Clay Chart
  const threeDData = chartSummary.map((c) => ({
    label: c.category_name,
    value: Math.min(100, Math.round((c.total_value / maxVal) * 100)),
    color: CATEGORY_COLORS[c.category_name] ?? "#0ea5e9",
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 space-y-8">
      <div className="clay-card p-6 md:p-10 space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/90 border border-yellow-300 text-xs font-bold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Komoditas Unggulan &amp; Ekonomi Wilayah
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Potensi Wilayah
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Pemetaan komoditas unggulan pertanian pangan, perikanan tangkap &amp; budidaya,
          perkebunan rakyat, dan UMKM di tingkat desa/kelurahan.
        </p>
        <div className="relative max-w-md pt-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari potensi komoditas atau nama desa..."
            className="clay-input w-full pl-10 pr-4 py-2.5 text-xs text-slate-900"
          />
        </div>
      </div>

      {/* 3D Interactive Clay Stat Chart & Kapasitas Sektor */}
      {chartSummary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Subtle3DCard className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">
                Visualisasi Kapasitas 3D Interaktif
              </h2>
            </div>
            <Clay3DStatChart stats={threeDData} />
            <div className="text-[11px] text-slate-500 text-center">
              Sorot kursor pada pilar 3D untuk melihat efek elevasi elastis
            </div>
          </Subtle3DCard>

          <Subtle3DCard className="lg:col-span-5 p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              Rincian Kapasitas Sektor
            </h2>
            <div className="space-y-3.5">
              {chartSummary.map((c) => {
                const pct = Math.max(12, Math.round((c.total_value / maxVal) * 100));
                return (
                  <div key={c.category_name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{c.category_name}</span>
                      <span className="text-sky-700 font-mono">
                        {c.total_value.toLocaleString("id-ID")} {c.unit}
                      </span>
                    </div>
                    <div className="h-3.5 rounded-full bg-sky-100/80 p-0.5 shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[c.category_name] ?? "#0284c7",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Subtle3DCard>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-xs text-sky-700 font-semibold">
          Memuat potensi wilayah...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-12 text-center text-xs text-slate-600">
          Belum ada data potensi wilayah untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p, idx) => (
            <Subtle3DCard key={p.id} delay={idx * 0.04} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="relative h-40 rounded-2xl overflow-hidden bg-sky-100 shadow-md">
                  <Image
                    src={getPotentialImage(p.title, p.category_name)}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    {p.category_name}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-yellow-300 text-slate-900 text-xs font-black shadow-md">
                    {p.metric_value} {p.metric_unit}
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="text-xs font-semibold text-sky-700 pt-3 border-t border-sky-100 flex items-center justify-between">
                <span>Lokasi: {p.village_name}</span>
                <span className="clay-pill px-2.5 py-0.5 text-[10px] text-slate-600">
                  Tahun {p.period_year}
                </span>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
  );
}
