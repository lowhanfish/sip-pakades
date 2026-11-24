"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Lock, Plus, Search, X } from "lucide-react";
import Swal from "sweetalert2";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, OptionItem, PaginatedResponse, ServiceStatus } from "@/types/global";
import { ServiceRequestItem } from "@/lib/mock/seed-admin";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";
import { isMockMode } from "@/lib/mock";

const STATUS_LABEL: Record<string, string> = {
  diterima: "DITERIMA",
  diproses: "DIPERIKSA",
  perlu_kelengkapan: "PERLU PERBAIKAN",
  menunggu_ttd: "MENUNGGU TTD",
  selesai: "SELESAI",
  ditolak: "DITOLAK",
};

async function confirmReject(): Promise<boolean> {
  const r = await Swal.fire({
    title: "Tolak permohonan ini?",
    text: "Alasan penolakan akan dilihat warga. Permohonan yang ditolak tidak dapat dibuka kembali.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Tolak",
    cancelButtonText: "Batal",
    confirmButtonColor: "#dc2626",
  });
  return r.isConfirmed;
}

export default function PelayananPermohonanPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [docsVerified, setDocsVerified] = useState(false);
  const [form, setForm] = useState({
    village_id: user?.village_id ?? "",
    service_type_id: "srv-nikah",
    applicant_name: "",
    applicant_nik: "",
    applicant_phone: "",
    applicant_address: "",
    village_cover_letter_no: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pelayanan-permohonan", search, statusFilter],
    queryFn: () => {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (statusFilter) q.set("status", statusFilter);
      return fetchData<PaginatedResponse<ServiceRequestItem>>(
        `${baseUrl}/api/v1/admin/pelayanan/permohonan/read?${q.toString()}`
      );
    },
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ["master-jenis-layanan-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/jenis-layanan/option`),
  });

  const { data: villages } = useQuery({
    queryKey: ["master-desa-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/desa/option`),
  });

  const createMut = useMutation({
    mutationFn: () =>
      fetchData<ApiEnvelope<ServiceRequestItem>>(
        `${baseUrl}/api/v1/admin/pelayanan/permohonan/create`,
        { method: "POST", body: form }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelayanan-permohonan"] });
      swallAlert(res.message, "success");
      setOpenCreate(false);
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      fetchData<ApiEnvelope<ServiceRequestItem>>(
        `${baseUrl}/api/v1/admin/pelayanan/permohonan/${id}/status`,
        { method: "PATCH", body: { status, note: statusNote, documents_verified: docsVerified } }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelayanan-permohonan"] });
      setDetail(res.data);
      setStatusNote("");
      setDocsVerified(false);
      swallAlert(res.message, "success");
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createMut.mutateAsync();
  }

  async function handleDownloadDraftPdf(srId: string, regNo: string) {
    if (isMockMode()) {
      swallAlert(
        "Mode Mock",
        "info",
        `Draf PDF untuk permohonan ${regNo} siap digenerate otomatis saat terhubung ke backend live.`
      );
      return;
    }
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/admin/pelayanan/permohonan/${srId}/draft-pdf`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`Gagal mengunduh draf PDF: HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `draf-rekomendasi-${regNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      swallAlert("Draf Surat Berhasil Diunduh", "success");
    } catch (err) {
      swallAlert("Gagal Mengunduh", "error", (err as Error).message);
    }
  }

  const canProcessStatus = user?.role !== "operator_desa";

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Pelayanan Administrasi (SIP-PAKADES)</h1>
            <p className="text-xs opacity-75">
              Pendaftaran layanan dari loket kecamatan atau pengantar desa/kelurahan beserta proteksi dokumen privat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Daftar Permohonan Baru
          </button>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-55" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor registrasi atau nama pemohon..."
              className="admin-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input rounded-xl px-3 py-2 text-xs"
          >
            <option value="">Semua Status</option>
            <option value="diterima">Diterima (perlu diverifikasi)</option>
            <option value="diproses">Sedang Diperiksa</option>
            <option value="perlu_kelengkapan">Menunggu Perbaikan Warga</option>
            <option value="menunggu_ttd">Menunggu Tanda Tangan Camat</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">No. Registrasi</th>
                  <th className="py-2.5 px-3">Pemohon</th>
                  <th className="py-2.5 px-3">Layanan</th>
                  <th className="py-2.5 px-3">Asal Wilayah</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3 font-mono font-bold text-sky-600">
                      {s.registration_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold">{s.applicant_name}</div>
                      <div className="text-[11px] opacity-65 font-mono">
                        NIK: {s.applicant_nik_masked}
                      </div>
                    </td>
                    <td className="py-3 px-3">{s.service_type_name}</td>
                    <td className="py-3 px-3">{s.village_name}</td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={s.status}
                        label={STATUS_LABEL[s.status] ?? s.status.toUpperCase()}
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg admin-glass text-[11px] font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Proses / Detail
                      </button>
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
              <h2 className="text-base font-bold">Registrasi Permohonan SIP-PAKADES</h2>
              <button type="button" onClick={() => setOpenCreate(false)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jenis Layanan *</label>
                  <select
                    value={form.service_type_id}
                    onChange={(e) => setForm({ ...form, service_type_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    {(serviceTypes ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {user?.role !== "operator_desa" && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Asal Desa/Kelurahan *</label>
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Pemohon *</label>
                  <input
                    type="text"
                    required
                    value={form.applicant_name}
                    onChange={(e) => setForm({ ...form, applicant_name: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">NIK Pemohon *</label>
                  <input
                    type="text"
                    required
                    minLength={16}
                    maxLength={16}
                    value={form.applicant_nik}
                    onChange={(e) => setForm({ ...form, applicant_nik: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">No. HP Pemohon</label>
                  <input
                    type="text"
                    value={form.applicant_phone}
                    onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">No. Surat Pengantar Desa</label>
                  <input
                    type="text"
                    value={form.village_cover_letter_no}
                    onChange={(e) => setForm({ ...form, village_cover_letter_no: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Alamat Pemohon</label>
                <input
                  type="text"
                  value={form.applicant_address}
                  onChange={(e) => setForm({ ...form, applicant_address: e.target.value })}
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Daftarkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-xl p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-sky-600">{detail.registration_number}</div>
                <h2 className="text-base font-bold">{detail.service_type_name}</h2>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="opacity-65">Pemohon:</span> <strong>{detail.applicant_name}</strong></div>
              <div><span className="opacity-65">Wilayah:</span> <strong>{detail.village_name}</strong></div>
              <div><span className="opacity-65">Pengantar Desa:</span> <strong>{detail.village_cover_letter_no || "-"}</strong></div>
              <div><span className="opacity-65">Target SLA:</span> <strong>{formatDateTimeId(detail.sla_due_at)}</strong></div>
              {detail.from_citizen && <div className="col-span-2"><span className="opacity-65">Sumber:</span> <strong>Diajukan warga melalui portal</strong></div>}
            </div>

            {detail.request_data && Object.keys(detail.request_data).length > 0 && (
              <div className="rounded-2xl border border-sky-400/20 p-3 space-y-1.5 text-xs">
                <div className="font-bold">Isian Permohonan</div>
                {Object.entries(detail.request_data).map(([k, v]) => (
                  <div key={k}><span className="opacity-65 capitalize">{k.replace(/_/g, " ")}:</span> <span className="whitespace-pre-line">{v}</span></div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-sky-400/20 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Dokumen Privat Pemohon (Terbatas Petugas Berwenang)
              </div>
              {detail.documents.length === 0 ? (
                <div className="opacity-65">Belum ada lampiran dokumen.</div>
              ) : (
                detail.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 bg-sky-500/5 rounded-lg px-3 py-1.5">
                    <span className="min-w-0 truncate">{d.doc_label} ({d.file_name})</span>
                    <a
                      href={`${baseUrl}/api/v1/admin/pelayanan/dokumen/${d.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-500/10"
                    >
                      <Download className="w-3 h-3" />
                      Buka
                    </a>
                  </div>
                ))
              )}
            </div>

            {detail.has_signed_letter && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-xs">
                <span>
                  Surat sudah ditandatangani secara elektronik
                  {detail.letter_number && <> · <span className="font-mono font-bold">{detail.letter_number}</span></>}
                </span>
                <a
                  href={`${baseUrl}/api/v1/admin/penandatangan/${detail.id}/surat`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 font-semibold text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Surat
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-400/20">
              <span className="text-[11px] opacity-70">Dokumen Cetak Rekomendasi Resmi</span>
              <button
                type="button"
                onClick={() => handleDownloadDraftPdf(detail.id, detail.registration_number)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 cursor-pointer transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Cetak Draf Surat (PDF)
              </button>
            </div>

            {canProcessStatus && (detail.next_statuses ?? []).length > 0 && (
              <div className="rounded-2xl border border-sky-400/20 p-3 space-y-2.5 text-xs">
                <div className="font-bold">Verifikasi &amp; Tindak Lanjut</div>
                <label className="block">
                  <span className="mb-1 block opacity-70">Catatan (dilihat warga)</span>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Wajib untuk minta perbaikan atau menolak..."
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </label>
                {(detail.next_statuses ?? []).includes("menunggu_ttd") && (
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={docsVerified}
                      onChange={(e) => setDocsVerified(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Saya sudah memeriksa kelengkapan berkas dan kesesuaian data pemohon.</span>
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  {(detail.next_statuses ?? []).includes("diproses") && (
                    <button type="button" disabled={statusMut.isPending}
                      onClick={() => statusMut.mutate({ id: detail.id, status: "diproses" })}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-semibold cursor-pointer disabled:opacity-50">
                      Mulai Periksa
                    </button>
                  )}
                  {(detail.next_statuses ?? []).includes("menunggu_ttd") && (
                    <button type="button" disabled={!docsVerified || statusMut.isPending}
                      onClick={() => statusMut.mutate({ id: detail.id, status: "menunggu_ttd" })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                      Verifikasi &amp; Teruskan ke Camat
                    </button>
                  )}
                  {(detail.next_statuses ?? []).includes("perlu_kelengkapan") && (
                    <button type="button" disabled={!statusNote.trim() || statusMut.isPending}
                      onClick={() => statusMut.mutate({ id: detail.id, status: "perlu_kelengkapan" })}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                      Minta Perbaikan
                    </button>
                  )}
                  {(detail.next_statuses ?? []).includes("ditolak") && (
                    <button type="button" disabled={!statusNote.trim() || statusMut.isPending}
                      onClick={async () => {
                        if (await confirmReject()) statusMut.mutate({ id: detail.id, status: "ditolak" });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                      Tolak
                    </button>
                  )}
                </div>
                {detail.status === "menunggu_ttd" && (
                  <p className="rounded-lg bg-blue-500/10 px-3 py-2 text-blue-700">
                    Berkas sudah terverifikasi dan menunggu tanda tangan Camat. Camat menandatangani lewat menu
                    Penandatanganan Surat (TTE).
                  </p>
                )}
              </div>
            )}

            {detail.histories.length > 0 && (
              <div className="rounded-2xl border border-sky-400/20 p-3 space-y-2 text-xs">
                <div className="font-bold">Riwayat Proses</div>
                <ol className="space-y-2">
                  {detail.histories.map((h, i) => (
                    <li key={`${h.status}-${i}`} className="border-l-2 border-sky-400/40 pl-3">
                      <div className="font-semibold">{STATUS_LABEL[h.status] ?? h.status} · <span className="opacity-70 font-normal">{h.changed_by_name}</span></div>
                      {h.note && <div className="opacity-80">{h.note}</div>}
                      <div className="text-[10px] opacity-60">{formatDateTimeId(h.changed_at)}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
