"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Menu, UserRound, X } from "lucide-react";
import { SITE_NAV_LINKS } from "./site-navigation";
import { usePublicDistricts } from "../hooks/usePublishData";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overHero = false; // hero banners are light now, so the header keeps dark text
  const { selectedSlug, setSelectedSlug } = usePublicDistrictStore();
  const { data: districtsRes } = usePublicDistricts();
  const districts = districtsRes?.data ?? [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-gutter pt-3">
      <div className={`glass-nav mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 rounded-full px-4 sm:px-5 ${scrolled ? "is-scrolled" : ""}`}>
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/img/logo-konsel.webp"
            alt="Logo Kabupaten Konawe Selatan"
            width={32}
            height={38}
            priority
            className="object-contain"
          />
          <div className="leading-tight">
            <div className={`f-display text-base font-extrabold ${overHero ? "text-white" : "text-sky-900"}`}>SIP-PAKADES</div>
            <div className={`hidden text-[11px] font-medium 2xl:block ${overHero ? "text-sky-100/80" : "text-slate-500"}`}>Pemerintah Kab. Konawe Selatan</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex">
          {SITE_NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 items-center whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold transition-colors ${active ? "bg-sky-600 text-white shadow-md shadow-sky-600/30" : "text-slate-700 hover:bg-white/80"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <select
              aria-label="Pilih Kecamatan"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {districts.length === 0 ? (
                <option value="laeya">Kec. Laeya</option>
              ) : (
                districts.map((d) => (
                  <option key={d.id} value={d.slug}>
                    Kec. {d.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <Link href="/masyarakat/dashboard" className="clay-btn clay-btn-yellow whitespace-nowrap px-3 py-2 text-[13px] sm:px-4">
            <UserRound className="w-3.5 h-3.5" />
            <span>Akun Warga</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="xl:hidden p-2 rounded-full border border-white/80 bg-white/80 text-slate-700"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-7xl space-y-3 rounded-3xl bg-white/95 px-4 py-4 shadow-xl xl:hidden">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <select
              aria-label="Pilih Kecamatan Mobile"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.slug}>
                  Kecamatan {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SITE_NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold text-center transition ${
                    active
                      ? "bg-sky-500 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-sky-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
