"use client";

import { Clock, Compass, MapPin, Ticket } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicTourism } from "../hooks/usePublishData";

export default function DestinasiWisataPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: res, isLoading } = usePublicTourism(slug);
  const items = res?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-10 space-y-8">
      <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-2">
        <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
          Pariwisata &amp; Daya Tarik Lokal
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          Destinasi Wisata Daerah
        </h1>
        <p className="text-sm text-slate-600">
          Jelajahi wisata bahari, alam, dan ekowisata unggulan di wilayah
          kecamatan.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-xs text-slate-500">
          Memuat destinasi wisata...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center text-xs text-slate-600">
          Belum ada data destinasi wisata untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, idx) => (
            <Subtle3DCard key={t.id} delay={idx * 0.05} className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-36 rounded-2xl bg-gradient-to-br from-sky-300/70 via-sky-200/60 to-yellow-200/80 border border-white/80 flex flex-col items-center justify-center text-sky-900">
                  <Compass className="w-10 h-10 mb-1" />
                  <span className="text-xs font-bold">{t.category_name}</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{t.name}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.facilities.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/85 border border-sky-200 text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-sky-200/60 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{t.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{t.opening_hours}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Ticket className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{t.ticket_info}</span>
                </div>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
  );
}
