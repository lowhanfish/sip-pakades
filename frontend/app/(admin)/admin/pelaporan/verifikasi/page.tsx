"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { QuarterlyReportItem } from "@/lib/mock/seed-admin";
import { ApiEnvelope, PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";

export default function PelaporanVerifikasiPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [returnTarget, setReturnTarget] = useState<QuarterlyReportItem | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pelaporan-verifikasi"],
    queryFn: () =>
      fetchData<PaginatedResponse<QuarterlyReportItem>>(
        `${baseUrl}/api/v1/admin/pelaporan/triwulan/read?status=diajukan`
      ),
  });

  const verifyMut = useMutation({
    mutationFn: ({
      id,
      decision,
      noteText,
    }: {
      id: string;
      decision: "terverifikasi" | "perlu_perbaikan";
      noteText: string;
    }) =>
      fetchData<ApiEnvelope<QuarterlyReportItem>>(
        `${baseUrl}/api/v1/admin/pelaporan/triwulan/${id}/verify`,
        { method: "POST", body: { decision, note: noteText } }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelaporan-verifikasi"] });
      qc.invalidateQueries({ queryKey: ["pelaporan-triwulan"] });
      swallAlert(res.message, "success");
      setReturnTarget(null);
      setNote("");
    },
    onError: (err: Error) => swallAlert("Gagal Verifikasi", "error", err.message),
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Antrean Verifikasi Laporan</h1>
        <p className="text-xs opacity-75">
          Hanya laporan berstatus <strong>Diajukan</strong> yang masuk ke antrean verifikasi Kecamatan.
        </p>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">Memuat antrean...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-10 text-center text-xs opacity-70">
            Tidak ada laporan menunggu verifikasi saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {data.data.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-sky-400/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={r.status} label="DIAJUKAN" />
                    <span className="text-[11px] font-semibold opacity-75">
                      {r.village_name} • {r.period_label} (v{r.submission_version})
                    </span>
                  </div>
                  <div className="text-sm font-bold">{r.title}</div>
                  <div className="text-[11px] opacity-65">
                    Diajukan pada {formatDateTimeId(r.submitted_at)} oleh {r.created_by_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      verifyMut.mutate({
                        id: r.id,
                        decision: "terverifikasi",
                        noteText: "Laporan lengkap dan terverifikasi.",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verifikasi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnTarget(r);
                      setNote("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400/90 hover:bg-amber-400 text-slate-900 text-xs font-semibold px-3.5 py-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Kembalikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Catatan Perbaikan Wajib</h2>
              <button type="button" onClick={() => setReturnTarget(null)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs opacity-75">
              Jelaskan bagian yang harus diperbaiki oleh <strong>{returnTarget.village_name}</strong>:
            </p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Lampiran realisasi fisik belum ditandatangani..."
              className="admin-input w-full rounded-xl p-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReturnTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
              <button
                type="button"
                onClick={() =>
                  verifyMut.mutate({
                    id: returnTarget.id,
                    decision: "perlu_perbaikan",
                    noteText: note,
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white cursor-pointer"
              >
                Kirim Catatan Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
