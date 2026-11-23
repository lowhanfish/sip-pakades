"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { DesaFormInput, DesaItem } from "../types";
import { useCreateDesa, useUpdateDesa } from "../hooks/crud";
import { useKecamatanOption } from "../../kecamatan/hooks/crud";
import { useAuthStore } from "@/store/useAuthStore";

interface FormDesaModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: DesaItem | null;
}

const EMPTY_FORM: DesaFormInput = {
  district_id: "",
  code: "",
  name: "",
  slug: "",
  type: "desa",
  description: "",
  history: "",
  boundaries: { north: "", south: "", east: "", west: "" },
  area_km2: null,
  dusun_count: 3,
  rw_count: 6,
  rt_count: 12,
  population_total: 0,
  household_total: 0,
  latitude: null,
  longitude: null,
  is_active: true,
};

export function FormDesaModal({
  open,
  onClose,
  editingItem,
}: FormDesaModalProps) {
  const user = useAuthStore((s) => s.user);
  const { data: districtOptions } = useKecamatanOption();
  const [form, setForm] = useState<DesaFormInput>(EMPTY_FORM);

  const createMutation = useCreateDesa();
  const updateMutation = useUpdateDesa();

  useEffect(() => {
    if (editingItem) {
      setForm({
        district_id: editingItem.district_id,
        code: editingItem.code,
        name: editingItem.name,
        slug: editingItem.slug,
        type: editingItem.type,
        description: editingItem.description ?? "",
        history: editingItem.history ?? "",
        boundaries: editingItem.boundaries ?? {
          north: "",
          south: "",
          east: "",
          west: "",
        },
        area_km2: editingItem.area_km2,
        dusun_count: editingItem.dusun_count,
        rw_count: editingItem.rw_count,
        rt_count: editingItem.rt_count,
        population_total: editingItem.population_total,
        household_total: editingItem.household_total,
        latitude: editingItem.latitude,
        longitude: editingItem.longitude,
        is_active: editingItem.is_active,
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        district_id: user?.district_id ?? districtOptions?.[0]?.id ?? "",
      });
    }
  }, [editingItem, open, user?.district_id, districtOptions]);

  if (!open) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;
  const lockDistrict = user?.role !== "superadmin_kab";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, payload: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="admin-glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {editingItem ? "Ubah Master Desa/Kelurahan" : "Tambah Master Desa/Kelurahan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-sky-500/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Kecamatan Induk *
              </label>
              <select
                required
                disabled={lockDistrict}
                value={form.district_id}
                onChange={(e) =>
                  setForm({ ...form, district_id: e.target.value })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">-- Pilih Kecamatan --</option>
                {(districtOptions ?? []).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Jenis Wilayah *
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "desa" | "kelurahan",
                  })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              >
                <option value="desa">Desa</option>
                <option value="kelurahan">Kelurahan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Kode Wilayah *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="7405112016"
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama Desa/Kelurahan *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({
                    ...form,
                    name,
                    slug: editingItem
                      ? form.slug
                      : name.toLowerCase().trim().replace(/\s+/g, "-"),
                  });
                }}
                placeholder="Torobulu"
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Luas (km²)</label>
              <input
                type="number"
                step="any"
                value={form.area_km2 ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    area_km2: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Penduduk</label>
              <input
                type="number"
                value={form.population_total}
                onChange={(e) =>
                  setForm({ ...form, population_total: Number(e.target.value) })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Jumlah KK</label>
              <input
                type="number"
                value={form.household_total}
                onChange={(e) =>
                  setForm({ ...form, household_total: Number(e.target.value) })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Dusun/Lingk.</label>
              <input
                type="number"
                value={form.dusun_count}
                onChange={(e) =>
                  setForm({ ...form, dusun_count: Number(e.target.value) })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="admin-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="rounded accent-sky-500"
            />
            Status Aktif
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-sky-400/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60 cursor-pointer"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
