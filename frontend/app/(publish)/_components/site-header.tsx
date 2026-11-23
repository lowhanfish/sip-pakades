"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, MapPin, Menu, X } from "lucide-react";
import { SITE_NAV_LINKS } from "./site-navigation";
import { usePublicDistricts } from "../hooks/usePublishData";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectedSlug, setSelectedSlug } = usePublicDistrictStore();
  const { data: districtsRes } = usePublicDistricts();
  const districts = districtsRes?.data ?? [];

  return (
    <header className="sticky top-0 z-40 px-4 pt-3">
      <div className="max-w-7xl mx-auto clay-card rounded-3xl px-5 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl p-1 bg-white/90 border-2 border-white shadow-xs flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/img/logo-konsel.webp"
              alt="Logo Kabupaten Konawe Selatan"
              width={34}
              height={40}
              priority
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
              SIP-PAKADES
            </div>
            <div className="text-[11px] font-bold text-sky-700">
              Kab. Konawe Selatan
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-sky-100/60 p-1.5 rounded-full border border-white/80 shadow-inner">
          {SITE_NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/30 scale-105"
                    : "text-slate-700 hover:text-sky-900 hover:bg-white/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* District Switcher + Login CTA */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 clay-pill px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <select
              aria-label="Pilih Kecamatan"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
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

          <Link
            href="/login"
            className="clay-btn clay-btn-yellow px-4 py-2 text-xs font-black shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2.5 rounded-2xl bg-white/85 border-2 border-white text-slate-800 shadow-sm"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2.5 clay-card rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 border border-sky-200 px-3.5 py-2.5 shadow-inner">
            <MapPin className="w-4 h-4 text-sky-600" />
            <select
              aria-label="Pilih Kecamatan Mobile"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
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
                  className={`px-3 py-2.5 rounded-2xl text-xs font-bold text-center transition ${
                    active
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                      : "bg-white/80 text-slate-700 hover:bg-sky-100"
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
