"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { CompletenessRow, TimelinessRow } from "@/lib/mock/seed-admin";
import { PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";

export default function PemantauanKelengkapanKetepatanPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);

  const compQuery = useQuery({
    queryKey: ["pemantauan-completeness"],
    queryFn: () =>
      fetchData<PaginatedResponse<CompletenessRow>>(
        `${baseUrl}/api/v1/admin/pemantauan/completeness`
      ),
  });

  const timeQuery = useQuery({
    queryKey: ["pemantauan-timeliness"],
    queryFn: () =>
      fetchData<PaginatedResponse<TimelinessRow>>(
        `${baseUrl}/api/v1/admin/pemantauan/timeliness`
      ),
  });

  return (
    <div className="space-y-5">
      <GlassCard>
        <h1 className="text-lg font-bold">Pemantauan Kelengkapan &amp; Ketepatan Waktu</h1>
        <p className="text-xs opacity-75">
          Matriks kelengkapan data desa/kelurahan dan kepatuhan tenggat pelaporan triwulanan.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="text-sm font-bold">1. Matriks Kelengkapan Data Wilayah</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-400/20 opacity-70">
                <th className="py-2 px-3">Wilayah</th>
                <th className="py-2 px-3">Profil</th>
                <th className="py-2 px-3">Perangkat</th>
                <th className="py-2 px-3">Potensi</th>
                <th className="py-2 px-3">Wisata</th>
                <th className="py-2 px-3">Kelengkapan</th>
              </tr>
            </thead>
            <tbody>
              {(compQuery.data?.data ?? []).map((row) => (
                <tr key={row.village_id} className="border-b border-sky-400/10">
                  <td className="py-2.5 px-3 font-semibold">{row.village_name}</td>
                  <td className="py-2.5 px-3">{row.has_profile ? "Lengkap" : "-"}</td>
                  <td className="py-2.5 px-3">{row.officials_count}</td>
                  <td className="py-2.5 px-3">{row.potentials_count}</td>
                  <td className="py-2.5 px-3">{row.tourism_count}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      variant={row.completeness_pct >= 90 ? "active" : "diajukan"}
                      label={`${row.completeness_pct}%`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="text-sm font-bold">2. Ketepatan Waktu Pelaporan Triwulanan (TW IV 2026)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-400/20 opacity-70">
                <th className="py-2 px-3">Wilayah</th>
                <th className="py-2 px-3">Jenis Laporan</th>
                <th className="py-2 px-3">Status Laporan</th>
                <th className="py-2 px-3">Ketepatan Waktu</th>
              </tr>
            </thead>
            <tbody>
              {(timeQuery.data?.data ?? []).map((row) => (
                <tr key={row.village_id} className="border-b border-sky-400/10">
                  <td className="py-2.5 px-3 font-semibold">{row.village_name}</td>
                  <td className="py-2.5 px-3">{row.report_type_name}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      variant={row.report_status === "belum_ada" ? "draf" : row.report_status}
                      label={row.report_status.replace("_", " ").toUpperCase()}
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge
                      variant={
                        row.timeliness_status === "tepat_waktu"
                          ? "terverifikasi"
                          : row.timeliness_status === "perlu_perbaikan"
                            ? "perlu_perbaikan"
                            : "draf"
                      }
                      label={row.timeliness_status.replace("_", " ").toUpperCase()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
