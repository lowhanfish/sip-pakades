"use client";

import { PageHero } from "@/components/motion/PageHero";
import Image from "next/image";
import { Eye, FileText, Newspaper, Users } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import {
  usePublicAnnouncements,
  usePublicOverview,
  usePublicRegulations,
} from "../hooks/usePublishData";
import { formatDateId } from "@/utilities/pagination";

export default function PemerintahanPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: overviewRes } = usePublicOverview(slug);
  const { data: annRes } = usePublicAnnouncements(slug);
  const { data: regRes } = usePublicRegulations(slug);

  const overview = overviewRes?.data;
  const district = overview?.district;
  const leader = overview?.leader;
  const org = overview?.org_structure ?? [];
  const announcements = annRes?.data ?? [];
  const regulations = regRes?.data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Penyelenggaraan Pemerintahan"
        title={`Pemerintah Kecamatan ${district?.name ?? "Laeya"}`}
        description="Profil kepemimpinan Camat, visi-misi, struktur organisasi, warta kegiatan kedinasan, serta regulasi daerah."
        image="/img/gedung-kecamatan.webp"
      />
    <div className="container-page pt-5 pb-8 space-y-6">

      {/* Pimpinan & Struktur */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <Subtle3DCard className="lg:col-span-5 card-accent flex flex-col justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-sky-200 shadow-md shadow-sky-900/10 ring-1 ring-sky-100">
              {leader?.photo_url ? (
                <Image src={leader.photo_url} alt={leader.full_name} fill sizes="96px" className="object-contain object-bottom" />
              ) : (
                <Users className="absolute bottom-6 left-1/2 h-8 w-8 -translate-x-1/2 text-sky-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">{leader?.position_name}</span>
              </div>
              <div className="mt-1 text-2xl leading-tight text-slate-900">{leader?.full_name}</div>
              {leader?.nip && <div className="mt-1 text-xs font-mono text-slate-400">NIP. {leader.nip}</div>}
            </div>
          </div>

          <div className="border-l-[3px] border-sky-300 pl-4">
            <p className="text-sm italic leading-relaxed text-slate-600" style={{ fontFamily: "var(--font-display)" }}>
              {leader?.welcome_message}
            </p>
          </div>

        </Subtle3DCard>

        <Subtle3DCard className="lg:col-span-7 card-accent flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30"><Users className="h-5 w-5" /></span>
            <h2 className="text-xl text-slate-900">Struktur Organisasi Kecamatan</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {org.map((node, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 rounded-2xl bg-white/55 p-3 transition hover:bg-white/80"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-base font-bold text-white shadow-md shadow-sky-500/25"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {(node.name ?? "?").trim().charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-sky-700">{node.position}</div>
                  <div className="truncate text-sm font-bold text-slate-900">{node.name}</div>
                  {node.nip && <div className="text-[11px] font-mono text-slate-400">NIP. {node.nip}</div>}
                </div>
              </div>
            ))}
          </div>
        </Subtle3DCard>
      </div>

      {/* Visi */}
      <div className="relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-sky-800 to-sky-600 px-6 py-4 text-white shadow-lg shadow-sky-900/20">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-yellow-300"><Eye className="h-5 w-5" /></span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100">Visi Kecamatan</div>
          <p className="mt-0.5 text-sm leading-snug sm:text-[15px]">{district?.vision}</p>
        </div>
      </div>

      {/* Berita & Regulasi */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <Subtle3DCard className="p-5 space-y-4 lg:col-span-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30"><Newspaper className="h-5 w-5" /></span>
            <h2 className="text-xl text-slate-900">Berita &amp; Pengumuman</h2>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="text-sm text-slate-500">Belum ada berita untuk kecamatan ini.</div>
            ) : (
              announcements.map((a) => (
                <article
                  key={a.id}
                  className="flex flex-col items-start gap-4 border-b border-white/80 pb-3 last:border-0 last:pb-0 sm:flex-row"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-sky-100 sm:w-32">
                    <Image src={a.thumbnail_url || "/img/berita-rakor.webp"} alt={a.title} fill sizes="128px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-sky-700">{a.category}</span>
                      <span className="text-slate-400">• {formatDateId(a.published_at)}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-slate-900">{a.title}</h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{a.content}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </Subtle3DCard>

        <Subtle3DCard className="p-5 space-y-4 lg:sticky lg:top-24 lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"><FileText className="h-5 w-5" /></span>
            <h2 className="text-xl text-slate-900">Regulasi &amp; SOP Layanan</h2>
          </div>
          <div className="space-y-3">
            {regulations.length === 0 ? (
              <div className="text-sm text-slate-500">Belum ada dokumen regulasi publik.</div>
            ) : (
              regulations.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3.5 border-b border-white/80 pb-3 last:border-0 last:pb-0"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm ring-1 ring-orange-100"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-800">{r.category}</span>
                      <span className="font-mono text-slate-400">{r.regulation_number}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-slate-900">{r.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-600">{r.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Subtle3DCard>
      </div>
    </div>
    </>
  );
}
