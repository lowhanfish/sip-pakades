"use client";

import { AreaIcon } from "@/components/ui/AreaIcon";
import { PageHero } from "@/components/motion/PageHero";
import { useState } from "react";
import { Building2, Search, Users, X } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import {
  usePublicVillageDetail,
  usePublicVillages,
} from "../hooks/usePublishData";

export default function DesaKelurahanPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

  const { data: villagesRes, isLoading } = usePublicVillages(
    slug,
    search,
    typeFilter,
    50
  );
  const detailQuery = usePublicVillageDetail(slug, selectedVillageId);
  const villages = villagesRes?.data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Direktori Wilayah Administrasi"
        title="Profil Desa &amp; Kelurahan"
        description="Telusuri desa dan kelurahan aktif, lengkap dengan susunan aparatur dan rincian kependudukan."
        image="/img/desa-kelurahan.webp"
      >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl pt-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama desa atau kelurahan..."
          className="clay-input w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900"
        />
      </div>
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="clay-input w-full px-3.5 py-2.5 text-sm text-slate-900 font-semibold"
      >
        <option value="">Semua (Desa &amp; Kelurahan)</option>
        <option value="kelurahan">Kelurahan</option>
        <option value="desa">Desa</option>
      </select>
    </div>
      </PageHero>
    <div className="container-page pt-5 pb-8 space-y-6">

      {isLoading ? (
        <div className="text-center py-12 text-sm text-slate-500">
          Memuat daftar desa dan kelurahan...
        </div>
      ) : villages.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center text-sm text-slate-600">
          Belum ada data desa/kelurahan untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map((v, idx) => (
            <Subtle3DCard key={v.id} delay={idx * 0.03} className="card-lift card-accent p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="pointer-events-none absolute right-5 top-1 select-none text-7xl font-bold leading-none text-sky-100/80" style={{ fontFamily: "var(--font-display)" }}>
                  {idx + 1}
                </span>
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md shadow-sky-900/10 ring-1 ring-sky-100">
                  <AreaIcon type={v.type} className="h-full w-full" />
                </span>
                <div className="relative flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      v.type === "kelurahan" ? "bg-orange-100 text-orange-800" : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {v.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{v.code}</span>
                </div>
                <h2 className="relative text-2xl text-slate-900 leading-snug">
                  {v.type === "kelurahan" ? "Kelurahan" : "Desa"} {v.name}
                </h2>
                <p className="relative text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {v.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center rounded-2xl bg-white/75 border border-sky-200/60 p-2.5 text-xs">
                  <div>
                    <div className="text-slate-500">Penduduk</div>
                    <div className="font-bold text-slate-900">
                      {v.population_total.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Luas</div>
                    <div className="font-bold text-slate-900">
                      {v.area_km2 ?? "-"} km²
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Dusun</div>
                    <div className="font-bold text-slate-900">{v.dusun_count}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVillageId(v.id)}
                  className="clay-btn clay-btn-sky w-full py-2.5 text-sm"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Lihat Profil &amp; Perangkat
                </button>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVillageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="clay-card bg-white/95 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl text-slate-900">
                {detailQuery.data?.data?.village
                  ? `${
                      detailQuery.data.data.village.type === "kelurahan"
                        ? "Kelurahan"
                        : "Desa"
                    } ${detailQuery.data.data.village.name}`
                  : "Memuat Profil..."}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVillageId(null)}
                className="p-2 rounded-xl hover:bg-sky-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Memuat detail wilayah...
              </div>
            ) : detailQuery.data?.data ? (
              <div className="space-y-4 text-sm">
                <p className="text-slate-700 leading-relaxed">
                  {detailQuery.data.data.village.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-sky-50 p-3">
                    <div className="text-slate-500">Kode Wilayah</div>
                    <div className="font-mono font-bold">
                      {detailQuery.data.data.village.code}
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3">
                    <div className="text-slate-500">Penduduk</div>
                    <div className="font-bold">
                      {detailQuery.data.data.village.population_total.toLocaleString(
                        "id-ID"
                      )}{" "}
                      jiwa
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3">
                    <div className="text-slate-500">Jumlah KK</div>
                    <div className="font-bold">
                      {detailQuery.data.data.village.household_total.toLocaleString(
                        "id-ID"
                      )}{" "}
                      KK
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3">
                    <div className="text-slate-500">Dusun / RW / RT</div>
                    <div className="font-bold">
                      {detailQuery.data.data.village.dusun_count} /{" "}
                      {detailQuery.data.data.village.rw_count} /{" "}
                      {detailQuery.data.data.village.rt_count}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Users className="w-4 h-4 text-sky-600" />
                    Perangkat Pemerintahan Wilayah
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailQuery.data.data.officials.map((o, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-sky-200 bg-white p-3"
                      >
                        <div className="text-xs font-bold text-sky-700">
                          {o.position_name}
                        </div>
                        <div className="font-bold text-slate-900">
                          {o.full_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
