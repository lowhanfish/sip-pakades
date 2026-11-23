"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { AuditLogItem } from "@/lib/mock/seed-admin";
import { PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { formatDateTimeId } from "@/utilities/pagination";

export default function SistemAuditLogPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const { data, isLoading } = useQuery({
    queryKey: ["sistem-audit-log"],
    queryFn: () =>
      fetchData<PaginatedResponse<AuditLogItem>>(
        `${baseUrl}/api/v1/admin/sistem/audit-log/read`
      ),
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Audit Log &amp; Riwayat Perubahan</h1>
        <p className="text-xs opacity-75">
          Catatan aktivitas pengguna, perubahan status, dan pengunduhan dokumen privat pemohon.
        </p>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat log...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pengguna</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Entitas</th>
                  <th className="py-2.5 px-3">Ringkasan</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((log) => (
                  <tr key={log.id} className="border-b border-sky-400/10">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {formatDateTimeId(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{log.user_name}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        variant={
                          log.action === "DOWNLOAD_PRIVATE_DOC"
                            ? "perlu_perbaikan"
                            : "diajukan"
                        }
                        label={log.action}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{log.entity_type}</td>
                    <td className="py-2.5 px-3">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
