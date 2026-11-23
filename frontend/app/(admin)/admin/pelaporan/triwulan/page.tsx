"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Send, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, OptionItem, PaginatedResponse } from "@/types/global";
import { QuarterlyReportItem } from "@/lib/mock/seed-admin";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";

export default function PelaporanTriwulanPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [detail, setDetail] = useState<QuarterlyReportItem | null>(null);
  const [form, setForm] = useState({
    village_id: user?.village_id ?? "",
    report_type_id: "rt-lppd",
    period_id: "per-2026-4",
    title: "",
    jumlah_kegiatan: 10,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pelaporan-triwulan", statusFilter, search],
    queryFn: () => {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      return fetchData<PaginatedResponse<QuarterlyReportItem>>(
        `${baseUrl}/api/v1/admin/pelaporan/triwulan/read?${q.toString()}`
      );
    },
  });

  const { data: reportTypes } = useQuery({
    queryKey: ["master-jenis-laporan-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/jenis-laporan/option`),
  });

  const { data: periods } = useQuery({
    queryKey: ["master-periode-laporan-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/periode-laporan/option`),
  });

  const { data: villages } = useQuery({
    queryKey: ["master-desa-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/desa/option`),
  });

  const createMut = useMutation({
    mutationFn: () =>
      fetchData<ApiEnvelope<QuarterlyReportItem>>(
        `${baseUrl}/api/v1/admin/pelaporan/triwulan/create`,
        {
          method: "POST",
          body: {
            village_id: form.village_id || undefined,
            report_type_id: form.report_type_id,
            period_id: form.period_id,
            title: form.title,
            summary_payload: { jumlah_kegiatan: form.jumlah_kegiatan },
          },
        }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelaporan-triwulan"] });
      swallAlert(res.message, "success");
      setOpenCreate(false);
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  const submitMut = useMutation({
    mutationFn: (id: string) =>
      fetchData<ApiEnvelope<QuarterlyReportItem>>(
        `${baseUrl}/api/v1/admin/pelaporan/triwulan/${id}/submit`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelaporan-triwulan"] });
      swallAlert(res.message, "success");
    },
    onError: (err: Error) => swallAlert("Gagal Mengajukan", "error", err.message),
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createMut.mutateAsync();
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Pelaporan Rutin Triwulanan</h1>
            <p className="text-xs opacity-75">
              Penyusunan draf, pengajuan, dan pemantauan revisi laporan triwulanan desa/kelurahan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Draf Laporan
          </button>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul laporan atau desa..."
            className="admin-input rounded-xl px-3 py-2 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input rounded-xl px-3 py-2 text-xs"
          >
            <option value="">Semua Status</option>
            <option value="draf">Draf</option>
            <option value="diajukan">Diajukan</option>
            <option value="perlu_perbaikan">Perlu Perbaikan</option>
            <option value="terverifikasi">Terverifikasi</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">Memuat laporan...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Judul &amp; Jenis Laporan</th>
                  <th className="py-2.5 px-3">Wilayah</th>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">Versi</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3">
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-[11px] opacity-65">{r.report_type_name}</div>
                    </td>
                    <td className="py-3 px-3">{r.village_name}</td>
                    <td className="py-3 px-3 font-semibold">{r.period_label}</td>
                    <td className="py-3 px-3">v{r.submission_version}</td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={r.status}
                        label={r.status.replace("_", " ").toUpperCase()}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetail(r)}
                          title="Detail & Riwayat"
                          className="p-1.5 rounded-lg hover:bg-sky-500/15 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(r.status === "draf" || r.status === "perlu_perbaikan") && (
                          <button
                            type="button"
                            onClick={() => submitMut.mutate(r.id)}
                            title="Ajukan ke Kecamatan"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            Ajukan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Buat Draf Laporan Triwulanan</h2>
              <button type="button" onClick={() => setOpenCreate(false)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {user?.role !== "operator_desa" && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Desa / Kelurahan *</label>
                  <select
                    required
                    value={form.village_id}
                    onChange={(e) => setForm({ ...form, village_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Pilih Wilayah --</option>
                    {(villages ?? []).map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jenis Laporan *</label>
                  <select
                    value={form.report_type_id}
                    onChange={(e) => setForm({ ...form, report_type_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    {(reportTypes ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Periode *</label>
                  <select
                    value={form.period_id}
                    onChange={(e) => setForm({ ...form, period_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    {(periods ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Laporan *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: LPPD Triwulan IV 2026"
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Ringkasan Jumlah Kegiatan</label>
                <input
                  type="number"
                  value={form.jumlah_kegiatan}
                  onChange={(e) => setForm({ ...form, jumlah_kegiatan: Number(e.target.value) })}
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Simpan Draf</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-70">{detail.village_name} • {detail.period_label}</div>
                <h2 className="text-base font-bold">{detail.title}</h2>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {detail.revision_note && (
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/40 p-3 text-xs">
                <strong>Catatan Perbaikan:</strong> {detail.revision_note}
              </div>
            )}
            <div className="space-y-2 text-xs">
              <div className="font-bold">Riwayat Perubahan Status</div>
              {detail.histories.map((h, i) => (
                <div key={i} className="rounded-xl border border-sky-400/20 p-3">
                  <div className="font-semibold">
                    {h.to_status.toUpperCase()} (v{h.submission_version}) • {h.changed_by_name}
                  </div>
                  <div className="opacity-75">{h.note}</div>
                  <div className="text-[10px] opacity-60">{formatDateTimeId(h.changed_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
