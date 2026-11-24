"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Building2, Clock, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { WordReveal } from "./primitives";

interface CinematicHeroProps {
  districtName: string;
  villageCount?: number;
}

/**
 * Bright hero: clear sky + district office photo, blue haze for the copy, a warm sun glow,
 * yellow district name, yellow primary CTA, frosted secondary CTA, a glass info strip and
 * three slowly floating glass chips over the sky.
 */
export function CinematicHero({ districtName, villageCount }: CinematicHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  const float = (d: number, dist = 8) =>
    reduce ? {} : { y: [0, -dist, 0], transition: { duration: d, repeat: Infinity, ease: "easeInOut" as const } };

  return (
    <section ref={ref} className="relative -mt-[68px] overflow-hidden">
      {/* Photo */}
      <motion.div style={{ y: photoY }} className="absolute inset-0 -top-[3%] h-[106%]">
        <Image
          src="/img/hero-kantor.webp"
          alt="Kantor kecamatan di tengah perbukitan hijau dan langit biru"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_50%]"
        />
      </motion.div>

      {/* Light: navy haze on the left, warm sun glow top-right, white mist at the bottom */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(96deg,rgba(15,23,42,0.74)_0%,rgba(30,58,138,0.5)_32%,rgba(37,99,235,0.1)_58%,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,rgba(254,240,138,0.45),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/70 via-sky-100/40 to-transparent" />
      <div className="film-grain pointer-events-none absolute inset-0 opacity-60" />

      <div className="container-page relative z-10 min-h-[500px] pb-32 pt-[104px] lg:min-h-[560px]">
        <motion.div style={{ y: copyY }} className="flex max-w-xl flex-col">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/60 bg-white/15 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-300" />
            </span>
            Portal Resmi · Kabupaten Konawe Selatan
          </motion.span>

          <h1 className="mt-5 flex flex-wrap items-baseline gap-x-3 text-white [text-shadow:0_6px_32px_rgba(15,23,42,0.35)]">
            <WordReveal text="Kecamatan" delay={0.2} className="f-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-[3.5rem]" />
            <WordReveal
              text={districtName}
              delay={0.4}
              className="f-display text-4xl font-bold leading-[1.1] text-yellow-300 [text-shadow:0_6px_36px_rgba(250,204,21,0.45)] sm:text-5xl lg:text-[3.5rem]"
            />
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-4 flex items-center gap-3"
          >
            <span className="h-7 w-1 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500" />
            <p className="f-display text-base font-semibold text-white sm:text-lg">Melayani dengan Hati, Membangun Bersama</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95 }}
            className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-[15px]"
          >
            Informasi, layanan publik, serta profil desa dan kelurahan di Kecamatan {districtName} tersedia untuk Anda dalam satu portal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="mt-6 flex flex-wrap gap-2.5"
          >
            <Link href="/layanan" className="clay-btn btn-sun px-6 py-3 text-sm">
              <FileCheck2 className="h-4 w-4" />
              Lacak Berkas
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/desa-kelurahan"
              className="clay-btn border-white/70 bg-white/15 px-6 py-3 text-sm text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] backdrop-blur-xl hover:bg-white/30"
            >
              Jelajahi Wilayah
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.35 }}
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-white/85"
          >
            <li className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-300" />Senin–Jumat, 08.00–16.00 WITA</li>
            <li className="hidden h-4 w-px bg-white/35 sm:block" />
            <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-300" />Layanan terbuka untuk semua</li>
          </motion.ul>
        </motion.div>

        {/* Floating glass chips over the sky (desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="pointer-events-none absolute right-[var(--gutter)] top-[120px] hidden lg:block"
        >
          <motion.div animate={float(6)} className="clay-tile mr-[22rem] mt-14 flex items-center gap-2.5 !rounded-2xl py-2.5 pl-2.5 pr-4">
            <span className="icon-tile h-9 w-9 bg-gradient-to-br from-blue-400 to-blue-600"><Building2 className="h-5 w-5" /></span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">{villageCount ?? 17} Desa &amp; Kelurahan</div>
              <div className="text-xs text-slate-600">Terdata di portal</div>
            </div>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.45 }}
          className="pointer-events-none absolute right-[var(--gutter)] top-[92px] hidden lg:block"
        >
          <motion.div animate={float(7, 10)} className="clay-tile flex items-center gap-2.5 !rounded-2xl py-2.5 pl-2.5 pr-4">
            <span className="icon-tile h-9 w-9 bg-gradient-to-br from-emerald-400 to-emerald-600"><ShieldCheck className="h-5 w-5" /></span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">Berkas Terlacak</div>
              <div className="text-xs text-slate-600">Transparan &amp; aman</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
