"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { BackupLogItem } from "@/lib/mock/seed-admin";
import { ApiEnvelope, PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";

export default function SistemPencadanganPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sistem-pencadangan"],
    queryFn: () =>
      fetchData<PaginatedResponse<BackupLogItem>>(
        `${baseUrl}/api/v1/admin/sistem/pencadangan/read`
      ),
  });

  const triggerMut = useMutation({
    mutationFn: () =>
      fetchData<ApiEnvelope<BackupLogItem>>(
        `${baseUrl}/api/v1/admin/sistem/pencadangan/trigger`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["sistem-pencadangan"] });
      swallAlert(res.message, "success");
    },
    onError: (err: Error) => swallAlert("Gagal Backup", "error", err.message),
  });

  async function handleDownloadBackup(bId: string, fileName: string) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/admin/sistem/pencadangan/download/${bId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Gagal mengunduh berkas: HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      swallAlert("Arsip database berhasil diunduh", "success");
    } catch (err) {
      swallAlert("Gagal Mengunduh", "error", (err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Pencadangan Database (MySQL Backup)</h1>
            <p className="text-xs opacity-75">
              Riwayat pencadangan otomatis dan pemicu manual arsip database <code>sippakades</code>.
            </p>
          </div>
          <button
            type="button"
            disabled={triggerMut.isPending}
            onClick={() => triggerMut.mutate()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <DatabaseBackup className="w-4 h-4" />
            {triggerMut.isPending ? "Memproses..." : "Jalankan Backup Sekarang"}
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat riwayat backup...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Nama File</th>
                  <th className="py-2.5 px-3">Ukuran</th>
                  <th className="py-2.5 px-3">Pemicu</th>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-sky-400/10">
                    <td className="py-2.5 px-3 font-mono font-semibold">{b.file_name}</td>
                    <td className="py-2.5 px-3">
                      {(b.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="py-2.5 px-3">{b.triggered_by_name}</td>
                    <td className="py-2.5 px-3">{formatDateTimeId(b.finished_at)}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        variant={b.status === "success" ? "active" : "perlu_perbaikan"}
                        label={b.status.toUpperCase()}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {b.status === "success" && (
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(b.id, b.file_name)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer transition shadow-xs"
                        >
                          <Download className="w-3 h-3" />
                          Unduh
                        </button>
                      )}
                    </td>
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
