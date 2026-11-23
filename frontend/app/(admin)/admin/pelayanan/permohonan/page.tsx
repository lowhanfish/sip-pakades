"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Lock, Plus, Search, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, OptionItem, PaginatedResponse, ServiceStatus } from "@/types/global";
import { ServiceRequestItem } from "@/lib/mock/seed-admin";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";

export default function PelayananPermohonanPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [statusNote, setStatusNote] = useState("");
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
        { method: "PATCH", body: { status, note: statusNote } }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pelayanan-permohonan"] });
      setDetail(res.data);
      setStatusNote("");
      swallAlert(res.message, "success");
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createMut.mutateAsync();
  }

  const canProcessStatus = user?.role !== "operator_desa";

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Pelayanan Administrasi (PATEN)</h1>
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
            <option value="diterima">Diterima</option>
            <option value="perlu_kelengkapan">Perlu Kelengkapan</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
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
                        label={s.status.replace("_", " ").toUpperCase()}
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
              <h2 className="text-base font-bold">Registrasi Permohonan PATEN</h2>
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
            </div>

            <div className="rounded-2xl border border-sky-400/20 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Dokumen Privat Pemohon (Terbatas Petugas Berwenang)
              </div>
              {detail.documents.length === 0 ? (
                <div className="opacity-65">Belum ada lampiran dokumen.</div>
              ) : (
                detail.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-sky-500/5 rounded-lg px-3 py-1.5">
                    <span>{d.doc_label} ({d.file_name})</span>
                    <span className="text-[10px] font-bold text-amber-600">PRIVAT</span>
                  </div>
                ))
              )}
            </div>

            {canProcessStatus && detail.status !== "selesai" && (
              <div className="rounded-2xl border border-sky-400/20 p-3 space-y-2.5 text-xs">
                <div className="font-bold">Perbarui Status Pelayanan</div>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Catatan proses / kekurangan berkas..."
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: detail.id, status: "perlu_kelengkapan" })}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 font-semibold cursor-pointer"
                  >
                    Perlu Kelengkapan
                  </button>
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: detail.id, status: "diproses" })}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-semibold cursor-pointer"
                  >
                    Diproses
                  </button>
                  <button
                    type="button"
                    onClick={() => statusMut.mutate({ id: detail.id, status: "selesai" })}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
