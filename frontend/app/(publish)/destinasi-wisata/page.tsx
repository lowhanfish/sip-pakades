"use client";

import { PageHero } from "@/components/motion/PageHero";
import Image from "next/image";
import { Clock, Compass, MapPin, Ticket } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicTourism } from "../hooks/usePublishData";

function getTourismImage(name: string, category: string = ""): string {
  const s = `${name} ${category}`.toLowerCase();
  if (s.includes("torobulu") || s.includes("pantai") || s.includes("bahari")) return "/img/wisata-torobulu.webp";
  if (s.includes("air terjun") || s.includes("curug")) return "/img/wisata-air-terjun.webp";
  if (s.includes("mangrove") || s.includes("bakau") || s.includes("pesisir")) return "/img/wisata-mangrove.webp";
  return "/img/wisata-torobulu.webp";
}

export default function DestinasiWisataPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: res, isLoading } = usePublicTourism(slug);
  const items = res?.data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Pariwisata &amp; Daya Tarik Lokal"
        title="Destinasi Wisata Unggulan"
        description="Jelajahi keindahan pesisir pantai bahari, air terjun alami, dan kawasan ekowisata mangrove di Kabupaten Konawe Selatan."
        image="/img/wisata-torobulu.webp"
      />
    <div className="container-page pt-5 pb-8 space-y-6">

      {isLoading ? (
        <div className="text-center py-12 text-sm text-sky-700 font-semibold">
          Memuat destinasi wisata...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-12 text-center text-sm text-slate-600">
          Belum ada data destinasi wisata untuk kecamatan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, idx) => (
            <Subtle3DCard key={t.id} delay={idx * 0.05} className="card-lift group flex flex-col p-1.5">
              <div className="relative h-60 overflow-hidden rounded-[1.1rem]">
                <Image
                  src={t.cover_image_url || getTourismImage(t.name, t.category_name)}
                  alt={t.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-950/85 via-sky-950/10 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-sky-800">
                  <Compass className="h-3.5 w-3.5" />
                  {t.category_name}
                </span>
                <span className="absolute right-4 top-1 select-none text-6xl font-bold leading-none text-white/30" style={{ fontFamily: "var(--font-display)" }}>
                  {idx + 1}
                </span>
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <h2 className="text-xl leading-snug">{t.name}</h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-4">
                <p className="text-sm leading-relaxed text-slate-600">{t.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {t.facilities.map((f) => (
                    <span key={f} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="mt-auto space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><MapPin className="h-4 w-4" /></span>
                    <span className="line-clamp-1">{t.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Clock className="h-4 w-4" /></span>
                    <span>{t.opening_hours}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-slate-800">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Ticket className="h-4 w-4" /></span>
                    <span>Tiket: {t.ticket_info}</span>
                  </div>
                </div>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
