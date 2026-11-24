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
    <footer className="mt-24 border-t border-white/10 bg-sky-900 text-sky-100/85">
      <div className="container-page py-9 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo-konsel.webp"
              alt="Logo Kab. Konawe Selatan"
              width={44}
              height={51}
            />
            <div>
              <div className="text-base font-extrabold text-white">
                SIP-PAKADES
              </div>
              <div className="text-xs font-medium text-sky-200/70">
                Kecamatan {district?.name ?? "Laeya"} • Kab. Konawe Selatan
              </div>
            </div>
          </div>
          <p className="text-sm text-sky-100/70 leading-relaxed">
            Sistem Informasi Penyelenggaraan Pemerintahan, Pelayanan Administrasi
            Kecamatan, dan Pelaporan Desa/Kelurahan (SIP-PAKADES).
          </p>
        </div>

        <div className="space-y-3 text-sm text-sky-100/80">
          <div className="font-bold text-white text-sm">
            Kantor Kecamatan {district?.name ?? "Laeya"}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>
              {district?.office_address ??
                "Jl. Poros Kendari - Andoolo, Kel. Puunggaluku"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{district?.service_hours ?? "Senin–Jumat, 08.00–16.00 WITA"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{district?.phone ?? "(0401) 319xxxx"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{district?.email ?? "kec.laeya@konaweselatankab.go.id"}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="font-bold text-white text-sm">Navigasi Portal</div>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            {SITE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sky-100/70 hover:text-white font-medium transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-sky-200/60">
        &copy; {new Date().getFullYear()} Pemerintah Kabupaten Konawe Selatan —
        SIP-PAKADES Kecamatan {district?.name ?? "Laeya"}.
      </div>
    </footer>
  );
}
