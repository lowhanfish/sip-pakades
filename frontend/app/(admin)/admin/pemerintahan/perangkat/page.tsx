"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Users, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, OptionItem, PaginatedResponse } from "@/types/global";
import { OfficialItem } from "@/lib/mock/seed-admin";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";

export default function PemerintahanPerangkatPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    position_id: "pos-kades",
    position_name: "Kepala Desa / Lurah",
    village_id: user?.village_id ?? "",
    nip: "",
    sk_number: "",
    phone: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pemerintahan-perangkat", search],
    queryFn: () =>
      fetchData<PaginatedResponse<OfficialItem>>(
        `${baseUrl}/api/v1/admin/pemerintahan/perangkat/read?search=${encodeURIComponent(
          search
        )}`
      ),
  });

  const { data: positions } = useQuery({
    queryKey: ["master-jabatan-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/jabatan/option`),
  });

  const { data: villages } = useQuery({
    queryKey: ["master-desa-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/desa/option`),
  });

  const createMut = useMutation({
    mutationFn: (payload: typeof form) =>
      fetchData<ApiEnvelope<OfficialItem>>(
        `${baseUrl}/api/v1/admin/pemerintahan/perangkat/create`,
        { method: "POST", body: payload }
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-perangkat"] });
      swallAlert(res.message, "success");
      setOpen(false);
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      fetchData(`${baseUrl}/api/v1/admin/pemerintahan/perangkat/delete/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-perangkat"] });
      swallAlert("Perangkat dihapus", "success");
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const pos = positions?.find((p) => p.id === form.position_id);
    await createMut.mutateAsync({
      ...form,
      position_name: pos?.label ?? form.position_name,
    });
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Data Perangkat Pemerintahan</h1>
            <p className="text-xs opacity-75">
              Perangkat Kecamatan dan Desa/Kelurahan sesuai jabatan dan SK aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Perangkat
          </button>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-55" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau jabatan..."
            className="admin-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Pejabat / Perangkat</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">Unit Wilayah</th>
                  <th className="py-2.5 px-3">SK / NIP</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-500/15 flex items-center justify-center shrink-0">
                          {item.photo_url ? (
                            <Image src={item.photo_url} alt={item.full_name} width={32} height={32} className="object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-sky-500" />
                          )}
                        </div>
                        <span className="font-semibold">{item.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{item.position_name}</td>
                    <td className="py-3 px-3">{item.village_name || "Kecamatan"}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {item.sk_number || item.nip || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={item.is_active ? "active" : "inactive"}
                        label={item.is_active ? "Aktif" : "Nonaktif"}
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirmDeleteAlert(item.full_name)) {
                            await deleteMut.mutateAsync(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Tambah Perangkat Pemerintahan</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-xl cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jabatan *</label>
                  <select
                    value={form.position_id}
                    onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    {(positions ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Wilayah</label>
                  <select
                    disabled={user?.role === "operator_desa"}
                    value={form.village_id}
                    onChange={(e) => setForm({ ...form, village_id: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs disabled:opacity-60"
                  >
                    <option value="">Kantor Kecamatan</option>
                    {(villages ?? []).map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nomor SK</label>
                  <input
                    type="text"
                    value={form.sk_number}
                    onChange={(e) => setForm({ ...form, sk_number: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
