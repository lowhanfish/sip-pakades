"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicOverview } from "../hooks/usePublishData";
import { SITE_NAV_LINKS } from "./site-navigation";

export function SiteFooter() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data } = usePublicOverview(slug);
  const district = data?.data?.district;

  return (
    <footer className="mt-16 px-4 pb-8">
      <div className="max-w-7xl mx-auto glass-panel rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo-konsel.webp"
              alt="Logo Kab. Konawe Selatan"
              width={44}
              height={51}
            />
            <div>
              <div className="text-base font-extrabold text-slate-900">
                SIP-PAKADES
              </div>
              <div className="text-xs font-semibold text-sky-700">
                Kecamatan {district?.name ?? "Laeya"} • Kab. Konawe Selatan
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sistem Informasi Penyelenggaraan Pemerintahan, Pelayanan Administrasi
            Kecamatan, dan Pelaporan Desa/Kelurahan (SIP-PAKADES).
          </p>
        </div>

        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="font-bold text-slate-900 text-sm">
            Kantor Kecamatan {district?.name ?? "Laeya"}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              {district?.office_address ??
                "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{district?.service_hours ?? "Senin–Jumat, 08.00–16.00 WITA"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{district?.phone ?? "(0401) 319xxxx"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{district?.email ?? "kec.laeya@konaweselatankab.go.id"}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="font-bold text-slate-900 text-sm">Navigasi Portal</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {SITE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-sky-700 font-medium transition"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sky-700 hover:text-sky-900 font-bold"
            >
              Login Petugas
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-center text-[11px] text-slate-500 pt-5">
        &copy; {new Date().getFullYear()} Pemerintah Kabupaten Konawe Selatan —
        SIP-PAKADES Kecamatan {district?.name ?? "Laeya"}.
      </div>
    </footer>
  );
}
