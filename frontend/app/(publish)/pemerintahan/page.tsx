"use client";

import Image from "next/image";
import { FileText, Newspaper, Users } from "lucide-react";
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
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-10 space-y-10">
      <div className="clay-card p-6 md:p-10 space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/90 border border-yellow-300 text-xs font-bold text-slate-800">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Informasi Penyelenggaraan Pemerintahan
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Pemerintah Kecamatan {district?.name ?? "Laeya"}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Profil kepemimpinan Camat, visi-misi, struktur organisasi perangkat kecamatan, warta kegiatan kedinasan, serta regulasi daerah.
            </p>
          </div>
          <div className="hidden md:block w-36 h-28 rounded-2xl overflow-hidden relative shadow-md shrink-0">
            <Image
              src="/img/gedung-kecamatan.webp"
              alt="Kantor Kecamatan"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Pimpinan & Struktur */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Subtle3DCard className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100 to-yellow-100 border border-white flex items-end justify-center shrink-0">
              {leader?.photo_url ? (
                <Image
                  src={leader.photo_url}
                  alt={leader.full_name}
                  width={80}
                  height={96}
                  className="object-contain h-full w-auto"
                />
              ) : (
                <Users className="w-8 h-8 text-sky-600 mb-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-sky-700">
                {leader?.position_name}
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {leader?.full_name}
              </div>
              {leader?.nip && (
                <div className="text-[11px] font-mono text-slate-500">
                  NIP. {leader.nip}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {leader?.welcome_message}
          </p>
          <div className="rounded-2xl bg-white/75 border border-sky-200/70 p-4 space-y-1.5 text-xs">
            <div className="font-bold text-sky-800">Visi Kecamatan</div>
            <p className="text-slate-700">{district?.vision}</p>
          </div>
        </Subtle3DCard>

        <Subtle3DCard className="lg:col-span-7 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Struktur Organisasi Kecamatan
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {org.map((node, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white/80 border border-sky-200/70 p-4 space-y-1"
              >
                <div className="text-[11px] font-bold text-sky-700">
                  {node.position}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {node.name}
                </div>
                {node.nip && (
                  <div className="text-[11px] font-mono text-slate-500">
                    NIP. {node.nip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Subtle3DCard>
      </div>

      {/* Berita & Regulasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Subtle3DCard className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Berita &amp; Pengumuman Pemerintahan
            </h2>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="text-xs text-slate-500">
                Belum ada berita untuk kecamatan ini.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="clay-tile p-4 flex flex-col sm:flex-row gap-3.5 items-start"
                >
                  <div className="relative w-full sm:w-28 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white bg-sky-100">
                    <Image
                      src={a.thumbnail_url || "/img/berita-rakor.webp"}
                      alt={a.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-white text-sky-800 font-bold uppercase shadow-2xs">
                        {a.category}
                      </span>
                      <span className="text-slate-500">
                        {formatDateId(a.published_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Subtle3DCard>

        <Subtle3DCard className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Dokumen Regulasi &amp; SOP Layanan
            </h2>
          </div>
          <div className="space-y-3">
            {regulations.length === 0 ? (
              <div className="text-xs text-slate-500">
                Belum ada dokumen regulasi publik.
              </div>
            ) : (
              regulations.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white/80 border border-sky-200/70 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-yellow-200/80 text-slate-900 font-bold">
                      {r.category}
                    </span>
                    <span className="font-mono text-slate-500">
                      {r.regulation_number}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-600">{r.description}</p>
                </div>
              ))
            )}
          </div>
        </Subtle3DCard>
      </div>
    </div>
  );
}
