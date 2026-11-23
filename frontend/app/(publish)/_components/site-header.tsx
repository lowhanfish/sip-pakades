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
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/img/logo-konsel.webp"
            alt="Logo Kabupaten Konawe Selatan"
            width={36}
            height={42}
            priority
          />
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">
              SIP-PAKADES
            </div>
            <div className="text-[11px] font-medium text-sky-700">
              Kab. Konawe Selatan
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {SITE_NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/25"
                    : "text-slate-700 hover:bg-sky-100/80 hover:text-sky-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* District Switcher + Login CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-white/80 border border-sky-200 px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <select
              aria-label="Pilih Kecamatan"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-300/95 hover:bg-yellow-300 text-slate-900 font-bold text-xs px-3.5 py-2 shadow-sm transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 rounded-xl bg-white/70 border border-sky-200 text-slate-800"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden max-w-7xl mx-auto mt-2 glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/85 border border-sky-200 px-3 py-2">
            <MapPin className="w-4 h-4 text-sky-600" />
            <select
              aria-label="Pilih Kecamatan Mobile"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.slug}>
                  Kecamatan {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SITE_NAV_LINKS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                    active
                      ? "bg-sky-500 text-white"
                      : "bg-white/60 text-slate-700 hover:bg-sky-100"
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
