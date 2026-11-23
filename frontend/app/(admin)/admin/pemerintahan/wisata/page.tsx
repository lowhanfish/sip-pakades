"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { OptionItem, PaginatedResponse } from "@/types/global";
import { PublicTourismItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";

export default function PemerintahanWisataPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    category_name: "Wisata Bahari & Pesisir",
    village_id: "",
    village_name: "Torobulu",
    opening_hours: "07:00 - 18:00 WITA",
    ticket_info: "Rp 5.000 / orang",
    description: "",
  });

  const { data: catOptions } = useQuery({
    queryKey: ["master-kategori-wisata-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/kategori-wisata/option`),
  });

  const { data: villageOptions } = useQuery({
    queryKey: ["master-desa-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/desa/option`),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pemerintahan-wisata"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicTourismItem>>(
        `${baseUrl}/api/v1/admin/pemerintahan/wisata/read`
      ),
  });

  const createMut = useMutation({
    mutationFn: (payload: typeof form) =>
      fetchData(`${baseUrl}/api/v1/admin/pemerintahan/wisata/create`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-wisata"] });
      swallAlert("Destinasi wisata ditambahkan", "success");
      setOpen(false);
      setForm({
        name: "",
        category_id: "",
        category_name: "Wisata Bahari & Pesisir",
        village_id: "",
        village_name: "Torobulu",
        opening_hours: "07:00 - 18:00 WITA",
        ticket_info: "Rp 5.000 / orang",
        description: "",
      });
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menambah", "error", err.message);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      fetchData(`${baseUrl}/api/v1/admin/pemerintahan/wisata/delete/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pemerintahan-wisata"] });
      swallAlert("Destinasi wisata dihapus", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menghapus", "error", err.message);
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
            <h1 className="text-lg font-bold">Destinasi Wisata Daerah</h1>
            <p className="text-xs opacity-75">
              Katalog destinasi wisata lokal yang tampil pada portal publik (gambar terkonversi otomatis ke WebP).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Wisata
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
                  <th className="py-2.5 px-3">Nama Destinasi</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Desa</th>
                  <th className="py-2.5 px-3">Jam Buka / Tiket</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((t) => (
                  <tr key={t.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3 font-semibold">{t.name}</td>
                    <td className="py-3 px-3">
                      <StatusBadge variant="kelurahan" label={t.category_name} />
                    </td>
                    <td className="py-3 px-3">{t.village_name}</td>
                    <td className="py-3 px-3">
                      <div>{t.opening_hours}</div>
                      <div className="text-[11px] opacity-65">{t.ticket_info}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (await confirmDeleteAlert(t.name)) {
                            await deleteMut.mutateAsync(t.id);
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
              <h2 className="text-base font-bold">Tambah Destinasi Wisata</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Destinasi *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Pantai Bahari Torobulu"
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Desa/Kelurahan</label>
                  <select
                    value={form.village_id}
                    onChange={(e) => {
                      const sel = villageOptions?.find((v) => v.id === e.target.value);
                      setForm({
                        ...form,
                        village_id: e.target.value,
                        village_name: sel ? sel.label : form.village_name,
                      });
                    }}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Pilih Wilayah --</option>
                    {(villageOptions ?? []).map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kategori Wisata</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => {
                      const sel = catOptions?.find((c) => c.id === e.target.value);
                      setForm({
                        ...form,
                        category_id: e.target.value,
                        category_name: sel ? sel.label : form.category_name,
                      });
                    }}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {(catOptions ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Operasional</label>
                  <input
                    type="text"
                    value={form.opening_hours}
                    onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tiket / Retribusi</label>
                  <input
                    type="text"
                    value={form.ticket_info}
                    onChange={(e) => setForm({ ...form, ticket_info: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Keterangan / Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Daya tarik utama destinasi..."
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
