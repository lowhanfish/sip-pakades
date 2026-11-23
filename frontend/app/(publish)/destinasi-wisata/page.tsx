"use client";

import Image from "next/image";
import { Clock, Compass, MapPin, Sparkles, Ticket } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicTourism } from "../hooks/usePublishData";

function getTourismImage(name: string, category: string = ""): string {
  const s = `${name} ${category}`.toLowerCase();
  if (s.includes("torobulu") || s.includes("pantai") || s.includes("bahari")) return "/img/wisata-torobulu.webp";
  if (s.includes("air terjun") || s.includes("moramo") || s.includes("curug")) return "/img/wisata-air-terjun.webp";
  if (s.includes("mangrove") || s.includes("bakau") || s.includes("pesisir")) return "/img/wisata-mangrove.webp";
  return "/img/wisata-torobulu.webp";
}

export default function DestinasiWisataPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: res, isLoading } = usePublicTourism(slug);
  const items = res?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 space-y-8">
      <div className="clay-card p-6 md:p-10 space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/90 border border-yellow-300 text-xs font-bold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Pariwisata &amp; Daya Tarik Lokal
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Destinasi Wisata Unggulan
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Jelajahi keindahan pesisir pantai bahari, air terjun alami, dan kawasan
          ekowisata mangrove yang mempesona di Kabupaten Konawe Selatan.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-sky-700 font-semibold">
          Memuat destinasi wisata...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-12 text-center text-xs text-slate-600">
          Belum ada data destinasi wisata untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, idx) => (
            <Subtle3DCard key={t.id} delay={idx * 0.05} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-sky-100 shadow-md">
                  <Image
                    src={getTourismImage(t.name, t.category_name)}
                    alt={t.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-sky-600/90 text-white text-xs font-bold shadow-md backdrop-blur-xs flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    {t.category_name}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-full bg-yellow-300/95 text-slate-900 text-xs font-extrabold shadow-md">
                    {t.ticket_info}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900">{t.name}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {t.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {t.facilities.map((f) => (
                    <span
                      key={f}
                      className="clay-pill text-[10px] font-semibold px-2.5 py-1 text-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-sky-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="line-clamp-1">{t.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{t.opening_hours}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tiket: {t.ticket_info}</span>
                </div>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
  );
}
