"use client";

import Link from "next/link";
import { Building2, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { GlassCard } from "../_components/ui/GlassCard";
import { StatusBadge } from "../_components/ui/StatusBadge";

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <StatusBadge variant="default" label="Tahap 1 • Fondasi & Golden Pattern" />
            <h1 className="text-xl font-bold pt-1">
              Selamat Datang, {user?.full_name}
            </h1>
            <p className="text-xs opacity-75">
              Peran: <strong>{user?.role_label}</strong>
              {user?.district_name ? ` • Kecamatan ${user.district_name}` : " • Lintas Kabupaten Konawe Selatan"}
              {user?.village_name ? ` • ${user.village_name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/master/kecamatan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 transition"
            >
              <MapPin className="w-4 h-4" />
              Master Kecamatan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/master/desa"
              className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-300/90 hover:bg-yellow-300 text-slate-900 text-xs font-semibold px-4 py-2.5 transition"
            >
              <Building2 className="w-4 h-4" />
              Master Desa/Kelurahan
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Cakupan Master Awal</div>
          <div className="text-2xl font-bold">25 Kecamatan</div>
          <div className="text-xs text-sky-600 font-medium">
            Kabupaten Konawe Selatan
          </div>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Kecamatan Pilot Aktif</div>
          <div className="text-2xl font-bold">17 Desa/Kel.</div>
          <div className="text-xs text-sky-600 font-medium">
            2 Kelurahan & 15 Desa di Kec. Laeya
          </div>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Mode Integrasi API</div>
          <div className="flex items-center gap-2 pt-1">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold">Mock SSOT Aktif</span>
          </div>
          <div className="text-xs opacity-70">
            Mengikuti Kontrak API_CONTRACT.md
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
