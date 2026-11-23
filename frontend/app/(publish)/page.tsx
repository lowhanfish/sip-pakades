"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Compass,
  FileCheck2,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import { HeroScene } from "@/components/three/HeroScene";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import {
  usePublicAnnouncements,
  usePublicOverview,
  usePublicPotentials,
  usePublicServiceTypes,
  usePublicTourism,
  usePublicVillages,
  useTrackServiceRequest,
} from "./hooks/usePublishData";
import { formatDateId } from "@/utilities/pagination";

const DistrictMap = dynamic(() => import("@/components/maps/DistrictMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-sky-100/70 animate-pulse flex items-center justify-center text-xs text-sky-700">
      Memuat peta wilayah...
    </div>
  ),
});

export default function PublishHomePage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: overviewRes } = usePublicOverview(slug);
  const { data: villagesRes } = usePublicVillages(slug, "", "", 6);
  const { data: potentialsRes } = usePublicPotentials(slug);
  const { data: tourismRes } = usePublicTourism(slug);
  const { data: announcementsRes } = usePublicAnnouncements(slug);
  const { data: servicesRes } = usePublicServiceTypes(slug);

  const [trackInput, setTrackInput] = useState("PATEN-740511-2026-0042");
  const [activeTrackCode, setActiveTrackCode] = useState("");
  const trackQuery = useTrackServiceRequest(activeTrackCode);

  const overview = overviewRes?.data;
  const district = overview?.district;
  const leader = overview?.leader;
  const stats = overview?.stats;
  const villages = useMemo(() => villagesRes?.data ?? [], [villagesRes?.data]);
  const potentials = potentialsRes?.data?.items ?? [];
  const tourism = tourismRes?.data ?? [];
  const announcements = announcementsRes?.data ?? [];
  const serviceTypes = servicesRes?.data ?? [];

  const mapMarkers = useMemo(() => {
    const list = [];
    if (district?.latitude && district?.longitude) {
      list.push({
        id: district.id,
        title: `Kantor Kecamatan ${district.name}`,
        subtitle: district.office_address ?? "",
        latitude: district.latitude,
        longitude: district.longitude,
        kind: "office" as const,
      });
    }
    for (const v of villages.slice(0, 6)) {
      if (v.latitude && v.longitude) {
        list.push({
          id: v.id,
          title: `${v.type === "kelurahan" ? "Kel." : "Desa"} ${v.name}`,
          subtitle: `${v.population_total.toLocaleString("id-ID")} jiwa`,
          latitude: v.latitude,
          longitude: v.longitude,
          kind: "village" as const,
        });
      }
    }
    return list;
  }, [district, villages]);

  function handleTrackSubmit(e: FormEvent) {
    e.preventDefault();
    setActiveTrackCode(trackInput.trim());
  }

  return (
    <div className="space-y-16 px-4 pt-6 pb-8">
      {/* 1. HERO SECTION 3D WEBGL */}
      <section className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-[2rem] p-6 md:p-10 lg:p-12 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-7 space-y-5 z-10"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-200/90 border border-yellow-300 px-3.5 py-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Portal Resmi Pemerintah Kabupaten Konawe Selatan
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Kecamatan{" "}
                <span className="text-sky-600">{district?.name ?? "Laeya"}</span>{" "}
                Terpadu, Transparan &amp; Melayani
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Sistem Informasi Penyelenggaraan Pemerintahan, Pelayanan
                Administrasi Terpadu Kecamatan (PATEN), Profil Desa/Kelurahan,
                Potensi Wilayah, dan Destinasi Wisata.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/layanan"
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm px-6 py-3 shadow-lg shadow-sky-500/25 transition"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Layanan &amp; Lacak PATEN
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/desa-kelurahan"
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-300/90 hover:bg-yellow-300 text-slate-900 font-bold text-sm px-6 py-3 transition"
                >
                  <Building2 className="w-4 h-4" />
                  Profil Desa &amp; Kelurahan
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="rounded-2xl bg-white/75 border border-sky-200/70 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Desa / Kelurahan
                  </div>
                  <div className="text-xl font-extrabold text-sky-700">
                    {stats?.total_villages ?? 17}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/75 border border-sky-200/70 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Potensi Wilayah
                  </div>
                  <div className="text-xl font-extrabold text-sky-700">
                    {stats?.total_potentials ?? 5}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/75 border border-sky-200/70 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Destinasi Wisata
                  </div>
                  <div className="text-xl font-extrabold text-sky-700">
                    {stats?.total_tourism ?? 3}
                  </div>
                </div>
                <div className="rounded-2xl bg-yellow-100/80 border border-yellow-300/70 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Layanan Selesai
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {stats?.total_services_completed ?? 128}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3D WebGL Interactive Orb */}
            <div className="lg:col-span-5 h-[280px] sm:h-[340px] lg:h-[390px] relative">
              <HeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SAMBUTAN CAMAT & VISI MISI */}
      <section className="max-w-7xl mx-auto">
        <Subtle3DCard className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative w-52 h-64 rounded-3xl overflow-hidden bg-gradient-to-b from-sky-200/70 via-sky-100/50 to-yellow-100/70 border border-white/80 shadow-lg flex items-end justify-center">
                {leader?.photo_url ? (
                  <Image
                    src={leader.photo_url}
                    alt={leader.full_name}
                    width={210}
                    height={260}
                    className="object-contain h-full w-auto"
                  />
                ) : (
                  <Users className="w-20 h-20 text-sky-500 mb-16" />
                )}
              </div>
              <div className="mt-3 text-center">
                <div className="text-base font-extrabold text-slate-900">
                  {leader?.full_name ?? "Ansar"}
                </div>
                <div className="text-xs font-semibold text-sky-700">
                  {leader?.position_name ?? "Camat Laeya"}
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800">
                Sambutan Pimpinan Kecamatan
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Melayani dengan Sepenuh Hati untuk Masyarakat Kecamatan{" "}
                {district?.name ?? "Laeya"}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {leader?.welcome_message}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl bg-white/75 border border-sky-200/70 p-4 space-y-1">
                  <div className="text-xs font-bold text-sky-700">Visi</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {district?.vision ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-yellow-50/80 border border-yellow-200/80 p-4 space-y-1">
                  <div className="text-xs font-bold text-slate-800">
                    Misi Utama
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {district?.mission ?? "-"}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/pemerintahan"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
                >
                  Lihat Struktur Organisasi &amp; Regulasi
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Subtle3DCard>
      </section>

      {/* 3. LAYANAN PATEN & LACAK STATUS CEPAT */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Pelayanan Administrasi Terpadu Kecamatan (PATEN)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Layanan Publik &amp; Pelacakan Berkas
            </h2>
          </div>
          <Link
            href="/layanan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            Lihat Semua Persyaratan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {serviceTypes.map((srv, idx) => (
              <Subtle3DCard key={srv.id} delay={idx * 0.06} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-200/80 text-slate-900">
                    Estimasi {srv.sla_days} Hari Kerja
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{srv.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <Link
                  href="/layanan"
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
                >
                  Cek Syarat <ArrowRight className="w-3 h-3" />
                </Link>
              </Subtle3DCard>
            ))}
          </div>

          {/* Inline Lacak Status */}
          <Subtle3DCard className="lg:col-span-5 p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-slate-900">
                Lacak Status Permohonan
              </div>
              <p className="text-xs text-slate-600">
                Masukkan nomor registrasi Anda (contoh:{" "}
                <code className="font-mono font-semibold text-sky-700">
                  PATEN-740511-2026-0042
                </code>
                ).
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex gap-2">
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="PATEN-740511-2026-0042"
                className="flex-1 rounded-xl border border-sky-200 bg-white/90 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Lacak
              </button>
            </form>

            {trackQuery.isFetching && (
              <div className="text-xs text-sky-700">Mencari berkas...</div>
            )}
            {trackQuery.isError && (
              <div className="text-xs text-rose-600 bg-rose-50/90 border border-rose-200 rounded-xl p-3">
                {(trackQuery.error as Error).message}
              </div>
            )}
            {trackQuery.data?.data && (
              <div className="rounded-2xl bg-white/85 border border-sky-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sky-800">
                    {trackQuery.data.data.registration_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-200 text-slate-900 font-bold uppercase text-[10px]">
                    {trackQuery.data.data.status.replace("_", " ")}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">
                  {trackQuery.data.data.service_type_name}
                </div>
                <div className="text-slate-600">
                  Pemohon: <strong>{trackQuery.data.data.applicant_name_masked}</strong>{" "}
                  • {trackQuery.data.data.village_name}
                </div>
              </div>
            )}
          </Subtle3DCard>
        </div>
      </section>

      {/* 4. DESA & KELURAHAN */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Wilayah Administrasi
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Profil Desa &amp; Kelurahan Kecamatan {district?.name ?? "Laeya"}
            </h2>
          </div>
          <Link
            href="/desa-kelurahan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900"
          >
            Lihat Seluruh {stats?.total_villages ?? villages.length} Wilayah
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map((v, idx) => (
            <Subtle3DCard key={v.id} delay={idx * 0.05} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 capitalize">
                  {v.type}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {v.code}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {v.type === "kelurahan" ? "Kelurahan" : "Desa"} {v.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {v.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-sky-200/60">
                <span>Penduduk: {v.population_total.toLocaleString("id-ID")}</span>
                <span>Luas: {v.area_km2 ?? "-"} km²</span>
              </div>
            </Subtle3DCard>
          ))}
        </div>
      </section>

      {/* 5. POTENSI & DESTINASI WISATA */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Subtle3DCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Potensi Unggulan Wilayah
              </h2>
            </div>
            <Link
              href="/potensi-wilayah"
              className="text-xs font-bold text-sky-700 hover:text-sky-900"
            >
              Selengkapnya →
            </Link>
          </div>
          <div className="space-y-3">
            {potentials.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white/75 border border-sky-200/70 p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {p.village_name} • {p.category_name}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-yellow-200/80 text-slate-900">
                  {p.metric_value} {p.metric_unit}
                </span>
              </div>
            ))}
          </div>
        </Subtle3DCard>

        <Subtle3DCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Destinasi Wisata Lokal
              </h2>
            </div>
            <Link
              href="/destinasi-wisata"
              className="text-xs font-bold text-sky-700 hover:text-sky-900"
            >
              Selengkapnya →
            </Link>
          </div>
          <div className="space-y-3">
            {tourism.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-white/75 border border-sky-200/70 p-3.5 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">{t.name}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {t.category_name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {t.description}
                </p>
                <div className="text-[11px] font-medium text-sky-700">
                  {t.village_name} • {t.ticket_info}
                </div>
              </div>
            ))}
          </div>
        </Subtle3DCard>
      </section>

      {/* 6. BERITA & LOKASI KANTOR KECAMATAN */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Subtle3DCard className="lg:col-span-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Berita &amp; Pengumuman
              </h2>
            </div>
            <Link
              href="/pemerintahan"
              className="text-xs font-bold text-sky-700 hover:text-sky-900"
            >
              Semua Berita →
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl bg-white/75 border border-sky-200/70 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase text-sky-700">
                    {a.category}
                  </span>
                  <span className="text-slate-500">
                    {formatDateId(a.published_at)}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{a.title}</div>
                <p className="text-xs text-slate-600 line-clamp-2">{a.excerpt}</p>
              </div>
            ))}
          </div>
        </Subtle3DCard>

        <Subtle3DCard className="lg:col-span-6 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Lokasi Kantor Kecamatan {district?.name ?? "Laeya"}
              </h2>
            </div>
            <Link
              href="/lokasi"
              className="text-xs font-bold text-sky-700 hover:text-sky-900"
            >
              Peta Penuh →
            </Link>
          </div>
          <DistrictMap
            centerLat={district?.latitude ?? -4.2738}
            centerLng={district?.longitude ?? 122.4664}
            zoom={11}
            markers={mapMarkers}
            heightClass="h-[300px]"
          />
          <div className="text-xs text-slate-600">
            <strong>Alamat:</strong>{" "}
            {district?.office_address ??
              "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku, Kec. Laeya"}
          </div>
        </Subtle3DCard>
      </section>
    </div>
  );
}
