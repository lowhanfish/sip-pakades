"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse } from "@/types/global";
import { PublicPotentialItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";

export default function PemerintahanPotensiPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    village_name: "Torobulu",
    category_name: "Perikanan & Kelautan",
    metric_value: 100,
    metric_unit: "Ton/Tahun",
    period_year: 2026,
    description: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pemerintahan-potensi"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicPotentialItem>>(
        `${baseUrl}/api/v1/admin/pemerintahan/potensi/read`
      ),
  });

  const createMut = useMutation({
    mutationFn: (payload: typeof form) =>
      fetchData(`${baseUrl}/api/v1/admin/pemerintahan/potensi/create`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-potensi"] });
      swallAlert("Potensi ditambahkan", "success");
      setOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      fetchData(`${baseUrl}/api/v1/admin/pemerintahan/potensi/delete/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-potensi"] });
      swallAlert("Potensi dihapus", "success");
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createMut.mutateAsync(form);
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Potensi Wilayah</h1>
            <p className="text-xs opacity-75">
              Pengelolaan data potensi pertanian, kelautan, perkebunan, dan UMKM.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Potensi
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Potensi</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Desa/Kelurahan</th>
                  <th className="py-2.5 px-3">Kapasitas</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3 font-semibold">{p.title}</td>
                    <td className="py-3 px-3">
                      <StatusBadge variant="kelurahan" label={p.category_name} />
                    </td>
                    <td className="py-3 px-3">{p.village_name}</td>
                    <td className="py-3 px-3 font-bold">
                      {p.metric_value} {p.metric_unit}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirmDeleteAlert(p.title)) {
                            await deleteMut.mutateAsync(p.id);
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
              <h2 className="text-base font-bold">Tambah Potensi Wilayah</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Potensi *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Desa/Kelurahan</label>
                  <input
                    type="text"
                    value={form.village_name}
                    onChange={(e) => setForm({ ...form, village_name: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kategori</label>
                  <input
                    type="text"
                    value={form.category_name}
                    onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nilai</label>
                  <input
                    type="number"
                    value={form.metric_value}
                    onChange={(e) => setForm({ ...form, metric_value: Number(e.target.value) })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Satuan</label>
                  <input
                    type="text"
                    value={form.metric_unit}
                    onChange={(e) => setForm({ ...form, metric_unit: e.target.value })}
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
