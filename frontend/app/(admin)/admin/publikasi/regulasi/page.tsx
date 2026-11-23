"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse } from "@/types/global";
import { PublicRegulationItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";

export default function PublikasiRegulasiPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const { data, isLoading } = useQuery({
    queryKey: ["publikasi-regulasi"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicRegulationItem>>(
        `${baseUrl}/api/v1/admin/publikasi/regulasi/read`
      ),
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Dokumen Regulasi &amp; SOP Layanan</h1>
        <p className="text-xs opacity-75">
          Direktori Perdes, SK Camat, Edaran, dan SOP PATEN yang dipublikasikan.
        </p>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat regulasi...</div>
        ) : (
          <div className="space-y-3">
            {(data?.data ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-sky-400/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="default" label={r.category} />
                    <span className="text-[11px] font-mono opacity-70">
                      {r.regulation_number}
                    </span>
                  </div>
                  <div className="text-sm font-bold">{r.title}</div>
                  <p className="text-xs opacity-75">{r.description}</p>
                </div>
                <StatusBadge variant="active" label={`Tahun ${r.year}`} />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
