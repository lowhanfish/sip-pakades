"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse } from "@/types/global";
import { PublicAnnouncementItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { formatDateId } from "@/utilities/pagination";

export default function PublikasiBeritaPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const { data, isLoading } = useQuery({
    queryKey: ["publikasi-berita"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicAnnouncementItem>>(
        `${baseUrl}/api/v1/admin/publikasi/berita/read`
      ),
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Berita &amp; Pengumuman Pemerintahan</h1>
        <p className="text-xs opacity-75">
          Publikasi berita kegiatan dan pengumuman resmi kecamatan &amp; desa.
        </p>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat berita...</div>
        ) : (
          <div className="space-y-3">
            {(data?.data ?? []).map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-sky-400/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant="kelurahan" label={a.category.toUpperCase()} />
                    <span className="text-[11px] opacity-65">
                      {formatDateId(a.published_at)}
                    </span>
                  </div>
                  <div className="text-sm font-bold">{a.title}</div>
                  <p className="text-xs opacity-75">{a.excerpt}</p>
                </div>
                <StatusBadge variant="active" label="Terbit" />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
