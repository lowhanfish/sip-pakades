"use client";

import { PageHero } from "@/components/motion/PageHero";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sprout } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicPotentials } from "../hooks/usePublishData";
import { getPotentialImage } from "@/lib/media";

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

  return (
    <>
      <PageHero
        eyebrow="Komoditas Unggulan &amp; Ekonomi Wilayah"
        title="Potensi Wilayah"
        description="Pemetaan komoditas unggulan pertanian, perikanan, perkebunan rakyat, dan UMKM di tingkat desa/kelurahan."
        image="/img/potensi-pertanian.webp"
      >
    <div className="relative max-w-md pt-2">
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari potensi komoditas atau nama desa..."
        className="clay-input w-full pl-10 pr-4 py-2.5 text-sm text-slate-900"
      />
    </div>
      </PageHero>
    <div className="container-page pt-7 pb-8 space-y-6">

      {chartSummary.length > 0 && (
        <Subtle3DCard className="card-accent p-6 md:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-eyebrow">Ringkasan Sektor</span>
              <h2 className="mt-1.5 text-2xl text-slate-900">Kapasitas per sektor unggulan</h2>
            </div>
            <p className="text-sm text-slate-500">Nilai tertinggi menjadi acuan panjang batang.</p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            {chartSummary.map((c, i) => {
              const pct = Math.max(8, Math.round((c.total_value / maxVal) * 100));
              const color = CATEGORY_COLORS[c.category_name] ?? "#0ea5e9";
              return (
                <div key={c.category_name} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">{c.category_name}</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                      {c.total_value.toLocaleString("id-ID")}{" "}
                      <span className="font-sans text-sm font-medium text-slate-500">{c.unit}</span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-sky-50">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Subtle3DCard>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-sm text-sky-700 font-semibold">
          Memuat potensi wilayah...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-12 text-center text-sm text-slate-600">
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
                  <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    {p.category_name}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-amber-300 text-amber-950 text-sm font-black shadow-md">
                    {p.metric_value} {p.metric_unit}
                  </div>
                </div>

                <h3 className="text-xl text-slate-900 leading-snug">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="text-sm font-semibold text-sky-700 pt-3 border-t border-sky-100 flex items-center justify-between">
                <span>Lokasi: {p.village_name}</span>
                <span className="clay-pill px-2.5 py-0.5 text-[11px] text-slate-600">
                  Tahun {p.period_year}
                </span>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
