"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useAuthStore } from "@/store/useAuthStore";
import { useUrlStore } from "@/store/useUrlStore";
import { ApiEnvelope } from "@/types/global";
import { GlassCard } from "../_components/ui/GlassCard";
import { StatusBadge } from "../_components/ui/StatusBadge";

interface SummaryData {
  active_villages_count: number;
  avg_completeness_pct: number;
  reports_on_time_count: number;
  reports_late_count: number;
  reports_pending_count: number;
  services_total: number;
  services_completed: number;
  services_sla_compliance_pct: number;
  incoming_letters_count: number;
  outgoing_letters_count: number;
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const baseUrl = useUrlStore((s) => s.URL.APP);

  const { data: summaryRes } = useQuery({
    queryKey: ["pemantauan-summary", user?.district_id],
    queryFn: () =>
      fetchData<ApiEnvelope<SummaryData>>(
        `${baseUrl}/api/v1/admin/pemantauan/summary`
      ),
  });

  const s = summaryRes?.data;

  return (
    <div className="space-y-5">
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <StatusBadge variant="default" label="SIP-PAKADES • Dashboard Internal" />
            <h1 className="text-xl font-bold pt-1">
              Selamat Datang, {user?.full_name}
            </h1>
            <p className="text-xs opacity-75">
              Peran: <strong>{user?.role_label}</strong>
              {user?.district_name
                ? ` • Kecamatan ${user.district_name}`
                : " • Lintas Kabupaten Konawe Selatan"}
              {user?.village_name ? ` • ${user.village_name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/pelaporan/triwulan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 transition"
            >
              <ClipboardList className="w-4 h-4" />
              Laporan Triwulanan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/pelayanan/permohonan"
              className="inline-flex items-center gap-1.5 rounded-xl bg-yellow-300/90 hover:bg-yellow-300 text-slate-900 text-xs font-semibold px-4 py-2.5 transition"
            >
              <FileCheck2 className="w-4 h-4" />
              Pelayanan SIP-PAKADES
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Kelengkapan Data Wilayah</div>
          <div className="text-2xl font-extrabold text-sky-500">
            {s?.avg_completeness_pct ?? 86.4}%
          </div>
          <div className="text-[11px] opacity-75">
            Dari {s?.active_villages_count ?? 17} desa/kelurahan aktif
          </div>
        </GlassCard>

        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Laporan Triwulan Tepat Waktu</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-emerald-500">
              {s?.reports_on_time_count ?? 2}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-[11px] opacity-75">
            Perlu tindak lanjut: {s?.reports_pending_count ?? 1} laporan
          </div>
        </GlassCard>

        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Kepatuhan SLA SIP-PAKADES</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-sky-500">
              {s?.services_sla_compliance_pct ?? 100}%
            </span>
            <ShieldCheck className="w-5 h-5 text-sky-500" />
          </div>
          <div className="text-[11px] opacity-75">
            {s?.services_completed ?? 1} dari {s?.services_total ?? 2} permohonan selesai
          </div>
        </GlassCard>

        <GlassCard className="space-y-1">
          <div className="text-xs opacity-70">Agenda Persuratan</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold">
              {(s?.incoming_letters_count ?? 1) + (s?.outgoing_letters_count ?? 1)}
            </span>
            <Mail className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-[11px] opacity-75">
            Masuk: {s?.incoming_letters_count ?? 1} • Keluar: {s?.outgoing_letters_count ?? 1}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
