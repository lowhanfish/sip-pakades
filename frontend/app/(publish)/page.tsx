"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Compass,
  FileCheck2,
  MapPin,
  Newspaper,
  Search,
  Eye,
  Target,
  Clock,
  Ruler,
  Sprout,
  Users, Sparkles } from "lucide-react";
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
import { getPotentialImage, getTourismImage } from "@/lib/media";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { CinematicHero } from "@/components/motion/CinematicHero";
import { CountUp, Reveal, ScrollProgress } from "@/components/motion/primitives";

const DistrictMap = dynamic(() => import("@/components/maps/DistrictMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] rounded-2xl bg-sky-100/70 animate-pulse flex items-center justify-center text-xs text-blue-700">
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

  const [trackInput, setTrackInput] = useState("SIP-740511-2026-0042");
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

  const TILE = [
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-violet-400 to-violet-600",
    "from-orange-400 to-orange-600",
    "from-cyan-400 to-cyan-600",
    "from-rose-400 to-rose-600",
  ];
  const mainServices = [
    { href: "/layanan", label: "Lacak Berkas", icon: FileCheck2 },
    { href: "/desa-kelurahan", label: "Profil Desa & Kelurahan", icon: Building2 },
    { href: "/potensi-wilayah", label: "Potensi Wilayah", icon: Sprout },
    { href: "/destinasi-wisata", label: "Destinasi Wisata", icon: Compass },
    { href: "/pemerintahan", label: "Pemerintahan & Berita", icon: Newspaper },
    { href: "/lokasi", label: "Lokasi & Kontak", icon: MapPin },
  ];
  const heroStats = [
    { label: "Desa / Kelurahan", value: stats?.total_villages ?? 17, icon: Building2 },
    { label: "Potensi Wilayah", value: stats?.total_potentials ?? 5, icon: Sprout },
    { label: "Destinasi Wisata", value: stats?.total_tourism ?? 3, icon: Compass },
    { label: "Layanan Selesai", value: stats?.total_services_completed ?? 128, icon: FileCheck2 },
  ];

  return (
    <div className="-mb-24">
      <ScrollProgress />

      {/* 1. HERO — cinematic */}
      <CinematicHero districtName={district?.name ?? "Laeya"} villageCount={stats?.total_villages} />

      {/* Layanan utama — frosted bar overlapping the hero */}
      <section className="relative z-20 -mt-20 px-gutter sm:-mt-24">
        <Reveal className="mx-auto max-w-7xl">
          <div className="clay-card grid grid-cols-2 gap-x-2 gap-y-5 p-4 sm:p-5 md:grid-cols-4 lg:grid-cols-7 lg:items-center lg:gap-y-0">
            <div className="col-span-2 flex items-center gap-4 md:col-span-4 lg:col-span-1 lg:pr-4">
              <span className="icon-tile h-12 w-12 bg-gradient-to-br from-orange-300 to-orange-500 text-sky-950"><Sparkles className="h-6 w-6" /></span>
              <div>
                <div className="f-display text-base font-bold leading-tight text-sky-950">Layanan Utama</div>
                <div className="text-sm text-slate-600">Akses cepat yang Anda butuhkan</div>
              </div>
            </div>
            {mainServices.map((m, i) => (
              <Link key={m.href} href={m.href} className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition hover:bg-white/70">
                <span className={`icon-tile h-11 w-11 bg-gradient-to-br ${TILE[i % TILE.length]} transition group-hover:-translate-y-1`}>
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-sky-950">{m.label}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="mt-6 px-gutter">
        <Reveal className="mx-auto max-w-7xl">
          <div className="clay-card card-accent grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-sky-100 overflow-hidden">
            {heroStats.map((it, i) => (
              <div key={it.label} className="flex items-center gap-3 p-4 sm:p-5">
                <span className={`icon-tile h-10 w-10 bg-gradient-to-br ${TILE[i % TILE.length]}`}>
                  <it.icon className="w-5 h-5" />
                </span>
                <div>
                  <CountUp value={Number(it.value)} className="f-display block text-2xl sm:text-3xl font-bold text-sky-950 leading-none tabular-nums" />
                  <div className="text-[13px] text-slate-600 mt-1">{it.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <div className="space-y-11 px-gutter pt-9">
        {/* 2. SAMBUTAN */}
        <section className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Portrait — plain, formal */}
            <Reveal className="md:col-span-3">
              <div className="relative mx-auto max-w-[200px]">
                <div className="absolute -bottom-3 -right-3 h-full w-full rounded-2xl bg-sky-100" />
                <figure className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-lg shadow-sky-900/10">
                  <div className="relative aspect-[4/5] bg-sky-200">
                    {leader?.photo_url ? (
                      <Image src={leader.photo_url} alt={leader.full_name} fill sizes="(max-width: 768px) 100vw, 380px" className="object-contain object-bottom" />
                    ) : (
                      <Users className="absolute bottom-16 left-1/2 h-24 w-24 -translate-x-1/2 text-sky-500" />
                    )}
                  </div>
                  <figcaption className="flex items-center justify-between gap-3 border-t border-sky-100 px-4 py-3">
                    <div>
                      <div className="text-base font-semibold leading-tight text-slate-900" style={{ fontFamily: "var(--font-display)" }}>{leader?.full_name ?? "Ansar"}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{leader?.position_name ?? "Camat Laeya"}</div>
                    </div>
                    <Image src="/img/logo-konsel.webp" alt="Logo Kab. Konawe Selatan" width={22} height={26} className="shrink-0 object-contain" />
                  </figcaption>
                </figure>
              </div>
            </Reveal>

            {/* Message */}
            <Subtle3DCard className="md:col-span-9 card-accent overflow-hidden p-5 md:p-6 space-y-4">
              <span className="pointer-events-none absolute -right-1 -top-6 select-none f-serif text-[9rem] leading-none text-sky-100/90">”</span>

              <div className="relative space-y-2">
                <span className="section-eyebrow !text-[11px]">Sambutan Camat</span>
                <h2 className="max-w-lg text-lg leading-snug text-slate-900 sm:text-xl">
                  Melayani dengan sepenuh hati untuk masyarakat Kecamatan {district?.name ?? "Laeya"}
                </h2>
              </div>

              <div className="relative border-l-[3px] border-sky-300 pl-4">
                <p className="text-[15px] italic leading-relaxed text-slate-700">
                  {leader?.welcome_message}
                </p>
                <div className="mt-2 text-xs font-semibold text-slate-800">
                  {leader?.full_name ?? "Ansar"} <span className="font-normal text-slate-400">·</span>{" "}
                  <span className="font-medium text-sky-700">{leader?.position_name ?? "Camat Laeya"}</span>
                </div>
              </div>

              <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-5">
                {/* Visi — solid deep block */}
                <div className="relative overflow-hidden rounded-xl bg-sky-900 p-3.5 text-white sm:col-span-2">
                  <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox="0 0 300 260" fill="none" stroke="white" strokeWidth="1" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M-10 190 C60 150 110 230 180 190 S280 160 320 185" />
                    <path d="M-10 215 C60 175 110 255 180 215 S280 185 320 210" />
                    <path d="M-10 240 C60 200 110 280 180 240 S280 210 320 235" />
                  </svg>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 text-amber-300"><Eye className="h-3.5 w-3.5" /></span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-100">Visi</span>
                    </div>
                    <p className="mt-2.5 text-sm leading-snug text-white" style={{ fontFamily: "var(--font-display)" }}>
                      {district?.vision ?? "-"}
                    </p>
                  </div>
                </div>

                {/* Misi — numbered list */}
                <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-white p-3.5 sm:col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500 text-white shadow-md shadow-orange-500/25"><Target className="h-3.5 w-3.5" /></span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">Misi Utama</span>
                  </div>
                  <ol className="mt-2.5 space-y-1.5">
                    {(district?.mission ?? "-")
                      .split("\n")
                      .map((l: string) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
                      .filter(Boolean)
                      .map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">{i + 1}</span>
                          <span className="text-sm leading-relaxed text-slate-700">{m}</span>
                        </li>
                      ))}
                  </ol>
                </div>
              </div>

              <Link href="/pemerintahan" className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900">
                Struktur organisasi &amp; regulasi <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Subtle3DCard>
          </div>
        </section>

        {/* 3. LAYANAN & LACAK */}
        <section className="max-w-7xl mx-auto space-y-8">
          <div className="clay-tile flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="space-y-2">
              <span className="section-eyebrow">Pelayanan Administrasi</span>
              <h2 className="section-title">Layanan publik &amp; pelacakan <em>berkas</em></h2>
            </div>
            <Link href="/layanan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
              Lihat semua persyaratan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-2 lg:col-span-7">
              {serviceTypes.map((srv, idx) => (
                <Subtle3DCard key={srv.id} delay={idx * 0.06} className={`card-lift card-accent p-5 flex flex-col justify-between gap-4 ${idx === 0 ? "sm:col-span-2" : ""}`}>
                  <div className="space-y-3">
                    <span className="pointer-events-none absolute right-4 top-1 f-display select-none text-6xl font-extrabold leading-none text-sky-100/80">
                      {idx + 1}
                    </span>
                    <span className={`icon-tile relative h-11 w-11 bg-gradient-to-br ${TILE[idx % TILE.length]}`}>
                      <FileCheck2 className="h-5 w-5" />
                    </span>
                    <h3 className="relative text-base font-bold text-slate-900 leading-snug">{srv.name}</h3>
                    <p className="relative text-sm text-slate-600 leading-relaxed">{srv.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5" /> {srv.sla_days} hari kerja
                    </span>
                    <Link href="/layanan" className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1">
                      Syarat <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Subtle3DCard>
              ))}
            </div>

            <Subtle3DCard className="bento-dark flex flex-col gap-5 p-6 lg:order-1 lg:col-span-5">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-white/10 text-sky-200 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xl font-semibold text-white tracking-tight">Lacak status permohonan</div>
                  <p className="text-sm text-white/70">
                    Contoh nomor: <code className="font-mono font-semibold text-sky-200">SIP-740511-2026-0042</code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                  placeholder="SIP-740511-2026-0042"
                  className="clay-input flex-1 min-w-0 px-4 py-3 text-sm text-slate-900"
                />
                <button type="submit" className="clay-btn clay-btn-sky px-5 py-3 text-sm">
                  Lacak
                </button>
              </form>

              {trackQuery.isFetching && <div className="text-sm text-white/70">Mencari berkas...</div>}
              {trackQuery.isError && (
                <div className="text-sm text-rose-700 bg-rose-50 rounded-xl p-3">
                  {(trackQuery.error as Error).message}
                </div>
              )}
              {trackQuery.data?.data && (
                <div className="rounded-2xl bg-white text-slate-800 p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sky-800">{trackQuery.data.data.registration_number}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold uppercase text-[10px]">
                      {trackQuery.data.data.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="font-semibold">{trackQuery.data.data.service_type_name}</div>
                  <div className="text-slate-600">
                    Pemohon: <strong>{trackQuery.data.data.applicant_name_masked}</strong> • {trackQuery.data.data.village_name}
                  </div>
                </div>
              )}
              <div>
                <div className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-white/60">Tahapan umum layanan</div>
                <div className="flex flex-wrap gap-2">
                  {["Diajukan", "Diverifikasi", "Diproses", "Selesai"].map((t) => (
                    <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">{t}</span>
                  ))}
                </div>
              </div>
              <ol className="mt-auto space-y-3.5 border-t border-white/15 pt-5">
                {[
                  "Ajukan berkas di kantor desa/kelurahan atau kecamatan.",
                  "Terima nomor registrasi pada tanda terima Anda.",
                  "Masukkan nomor tersebut di atas untuk memantau status.",
                ].map((t, i) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-snug text-white/85">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-xs font-bold text-sky-950">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </Subtle3DCard>
          </div>
        </section>

        {/* 4. DESA & KELURAHAN */}
        <section className="max-w-7xl mx-auto space-y-8">
          <div className="clay-tile flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="space-y-2">
              <span className="section-eyebrow">Wilayah Administrasi</span>
              <h2 className="section-title">Desa &amp; kelurahan di <em>Kecamatan {district?.name ?? "Laeya"}</em></h2>
            </div>
            <Link href="/desa-kelurahan" className="clay-btn clay-btn-sky text-sm px-5 py-2.5 self-start sm:self-auto shrink-0">
              Lihat {stats?.total_villages ?? villages.length} wilayah <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {villages.map((v, idx) => (
              <Subtle3DCard key={v.id} delay={idx * 0.05} className="card-lift card-accent px-5 pb-4 pt-6 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <span className="pointer-events-none absolute right-4 top-1 f-display select-none text-6xl font-extrabold leading-none text-sky-100/80">
                    {idx + 1}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-sky-900/10 ring-1 ring-sky-100">
                    <AreaIcon type={v.type} className="h-full w-full" />
                  </span>
                  <div className="relative space-y-0.5">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {v.type === "kelurahan" ? "Kelurahan" : "Desa"} {v.name}
                    </h3>
                    <span className="text-xs font-mono text-slate-400">{v.code}</span>
                  </div>
                  <p className="relative text-sm text-slate-600 line-clamp-2 leading-relaxed">{v.description}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 mt-auto">
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{v.population_total.toLocaleString("id-ID")}</span>
                    <span className="inline-flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" />{v.area_km2 ?? "-"} km²</span>
                  </span>
                  <Link href="/desa-kelurahan" className="font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1">
                    Profil <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Subtle3DCard>
            ))}
          </div>
        </section>

        {/* 5. POTENSI */}
        <section className="max-w-7xl mx-auto space-y-8">
          <div className="clay-tile flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="space-y-2">
              <span className="section-eyebrow">Potensi Unggulan</span>
              <h2 className="section-title">Kekuatan <em>ekonomi</em> wilayah</h2>
            </div>
            <Link href="/potensi-wilayah" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
              Semua potensi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Featured */}
            {potentials[0] && (
              <Subtle3DCard className="card-lift group flex flex-col p-2 lg:col-span-7">
                <div className="relative min-h-[15rem] flex-1 overflow-hidden rounded-[1.4rem]">
                  <Image
                    src={getPotentialImage(potentials[0].title, potentials[0].category_name)}
                    alt={potentials[0].title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-sky-800 backdrop-blur">
                    {potentials[0].category_name}
                  </span>
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-white/75">Kapasitas</div>
                    <div className="f-display text-3xl font-bold leading-none">
                      {Number(potentials[0].metric_value).toLocaleString("id-ID")}
                      <span className="ml-1.5 text-base font-medium text-white/85">{potentials[0].metric_unit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 pb-3 pt-4">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">{potentials[0].title}</h3>
                  <div className="flex shrink-0 items-center gap-2 text-sm text-slate-600">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600"><MapPin className="h-4 w-4" /></span>
                    {potentials[0].village_name}
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800">{potentials[0].period_year}</span>
                  </div>
                </div>
              </Subtle3DCard>
            )}

            {/* Compact rows — image left, text right, each exactly as tall as its content */}
            <div className="grid gap-5 lg:col-span-5">
              {potentials.slice(1, 3).map((p, idx) => (
                <Subtle3DCard key={p.id} delay={(idx + 1) * 0.06} className="card-lift group flex flex-col p-2 sm:flex-row">
                  <div className="relative h-36 shrink-0 overflow-hidden rounded-[1.2rem] sm:h-auto sm:w-[42%]">
                    <Image
                      src={getPotentialImage(p.title, p.category_name)}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 220px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="f-display text-2xl font-bold leading-none">
                        {Number(p.metric_value).toLocaleString("id-ID")}
                        <span className="ml-1 text-xs font-medium text-white/85">{p.metric_unit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div>
                      <span className="inline-block rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-800">{p.category_name}</span>
                      <h3 className="mt-2.5 line-clamp-3 text-base font-bold leading-snug text-slate-900">{p.title}</h3>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-sky-600" />{p.village_name}</span>
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800">{p.period_year}</span>
                    </div>
                  </div>
                </Subtle3DCard>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WISATA — handled outside the padded container for full-bleed pin */}
        {/* 7. BERITA & LOKASI */}
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
          <Subtle3DCard className="flex flex-col gap-6 p-5 sm:p-6 lg:col-span-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="icon-tile h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600"><Newspaper className="h-5 w-5" /></span>
                <div>
                  <div className="section-eyebrow !text-[11px]">Kabar Terbaru</div>
                  <h2 className="text-xl text-slate-900 sm:text-2xl">Berita &amp; pengumuman</h2>
                </div>
              </div>
              <Link href="/pemerintahan" className="clay-btn clay-btn-glass shrink-0 px-4 py-2 text-sm text-slate-900">
                Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {announcements[0] && (
              <article className="group relative h-52 overflow-hidden rounded-3xl shadow-lg shadow-slate-900/10 sm:h-56">
                <Image src={announcements[0].thumbnail_url || "/img/berita-rakor.webp"} alt={announcements[0].title} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-6 sm:bottom-6">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="rounded-full bg-yellow-300 px-3 py-1 font-bold uppercase tracking-wide text-sky-950">{announcements[0].category}</span>
                    <span className="text-white/85">{formatDateId(announcements[0].published_at)}</span>
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 text-lg font-bold leading-snug sm:text-xl">{announcements[0].title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/85">{announcements[0].excerpt}</p>
                </div>
              </article>
            )}

            <div className="divide-y divide-white/80">
              {announcements.slice(1, 4).map((a) => (
                <div key={a.id} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-[4.25rem] w-24 shrink-0 overflow-hidden rounded-2xl bg-sky-100">
                    <Image src={a.thumbnail_url || "/img/berita-rakor.webp"} alt={a.title} fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-sky-700">{a.category}</span>
                      <span className="text-slate-500">{formatDateId(a.published_at)}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">{a.title}</div>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600 sm:block" />
                </div>
              ))}
            </div>
          </Subtle3DCard>

          <Subtle3DCard className="flex flex-col gap-5 p-5 sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="icon-tile h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-600"><MapPin className="h-5 w-5" /></span>
                <div>
                  <div className="section-eyebrow !text-[11px]">Kunjungi Kami</div>
                  <h2 className="text-xl text-slate-900 sm:text-2xl">Kantor Kecamatan {district?.name ?? "Laeya"}</h2>
                </div>
              </div>
            </div>

            <div className="relative min-h-[250px] flex-1 overflow-hidden rounded-3xl border-2 border-white/80 shadow-lg shadow-slate-900/10">
              <DistrictMap
                centerLat={district?.latitude ?? -4.2738}
                centerLng={district?.longitude ?? 122.4664}
                zoom={11}
                markers={mapMarkers}
                heightClass="absolute inset-0 !h-full"
              />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3 rounded-2xl bg-white/60 p-3.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span className="text-slate-700"><strong className="text-slate-900">Alamat:</strong> {district?.office_address ?? "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku, Kec. Laeya"}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-3.5">
                <Clock className="h-4 w-4 shrink-0 text-sky-600" />
                <span className="text-slate-700"><strong className="text-slate-900">Jam layanan:</strong> Senin–Jumat, 08.00–16.00 WITA</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/lokasi" className="clay-btn btn-sun flex-1 px-5 py-3 text-sm">Peta penuh <ArrowRight className="h-4 w-4" /></Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${district?.latitude ?? -4.2738},${district?.longitude ?? 122.4664}`}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn clay-btn-glass flex-1 px-5 py-3 text-sm text-slate-900"
              >
                Petunjuk arah
              </a>
            </div>
          </Subtle3DCard>
        </section>
      </div>

      {/* WISATA — pinned horizontal scroll on desktop */}
      {tourism.length > 0 && <TourismShowcase items={tourism.slice(0, 3)} />}
    </div>
  );
}

function TourismShowcase({
  items,
}: {
  items: { id: string; name: string; category_name: string; village_name: string; ticket_info: string; description?: string; cover_image_url?: string | null }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${Math.max(items.length - 1, 1) * 62}%`]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const header = (
    <div className="clay-tile max-w-md space-y-3 p-7">
      <span className="section-eyebrow">Destinasi Wisata</span>
      <h2 className="section-title">Jelajahi <em>keindahan</em> daerah</h2>
      <p className="text-slate-600 text-base leading-relaxed">Pesisir, air terjun, dan hutan bakau — tiga wajah alam Konawe Selatan.</p>
      <Link href="/destinasi-wisata" className="clay-btn clay-btn-sky px-6 py-3 text-sm mt-3">
        Semua destinasi <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop: pinned */}
      <section ref={ref} className="relative mt-16 hidden h-[230vh] md:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          
          <div className="container-page relative flex items-center gap-16">
            <div className="w-[32%] shrink-0">{header}</div>
            <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_5%)]">
              <motion.div style={{ x }} className="flex gap-6 will-change-transform">
                {items.map((t, i) => (
                  <article key={t.id} className="group relative h-[68vh] w-[58%] min-w-[380px] shrink-0 overflow-hidden rounded-[2rem]">
                    <Image
                      src={t.cover_image_url || getTourismImage(t.name, t.category_name)}
                      alt={t.name}
                      fill
                      sizes="50vw"
                      className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-sky-950/10 to-transparent" />
                    <span className="absolute left-6 top-6 rounded-full bg-white/95 px-3.5 py-1 text-xs font-semibold text-sky-800">{t.category_name}</span>
                    <span className="absolute right-6 top-5 text-6xl font-semibold text-white/30" style={{ fontFamily: "var(--font-display)" }}>0{i + 1}</span>
                    <div className="absolute inset-x-7 bottom-7 text-white">
                      <h3 className="text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>{t.name}</h3>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-100"><MapPin className="w-4 h-4" />{t.village_name} · {t.ticket_info}</div>
                    </div>
                  </article>
                ))}
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 h-[3px] w-48 -translate-x-1/2 overflow-hidden rounded-full bg-sky-900/15">
            <motion.div style={{ width: bar }} className="h-full bg-sky-500" />
          </div>
        </div>
      </section>

      {/* Mobile: stacked */}
      <section className="mt-24 px-4 pb-32 pt-14 md:hidden">
        {header}
        <div className="mt-8 space-y-5">
          {items.map((t) => (
            <article key={t.id} className="relative h-80 overflow-hidden rounded-3xl">
              <Image src={t.cover_image_url || getTourismImage(t.name, t.category_name)} alt={t.name} fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-950/90 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white">
                <h3 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>{t.name}</h3>
                <div className="mt-1 text-xs text-sky-100">{t.village_name} · {t.ticket_info}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
