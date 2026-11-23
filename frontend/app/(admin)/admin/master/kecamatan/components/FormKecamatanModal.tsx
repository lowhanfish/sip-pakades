"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { KecamatanFormInput, KecamatanItem } from "../types";
import { useCreateKecamatan, useUpdateKecamatan } from "../hooks/crud";

interface FormKecamatanModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: KecamatanItem | null;
}

const EMPTY_FORM: KecamatanFormInput = {
  code: "",
  name: "",
  slug: "",
  office_address: "",
  phone: "",
  email: "",
  service_hours: "Senin–Jumat, 08.00–16.00 WITA",
  vision: "",
  mission: "",
  latitude: null,
  longitude: null,
  is_active: true,
  is_default: false,
};

export function FormKecamatanModal({
  open,
  onClose,
  editingItem,
}: FormKecamatanModalProps) {
  const [form, setForm] = useState<KecamatanFormInput>(EMPTY_FORM);
  const createMutation = useCreateKecamatan();
  const updateMutation = useUpdateKecamatan();

  useEffect(() => {
    if (editingItem) {
      setForm({
        code: editingItem.code,
        name: editingItem.name,
        slug: editingItem.slug,
        office_address: editingItem.office_address ?? "",
        phone: editingItem.phone ?? "",
        email: editingItem.email ?? "",
        service_hours: editingItem.service_hours ?? "",
        vision: editingItem.vision ?? "",
        mission: editingItem.mission ?? "",
        latitude: editingItem.latitude,
        longitude: editingItem.longitude,
        is_active: editingItem.is_active,
        is_default: editingItem.is_default,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingItem, open]);

  if (!open) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

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
            {editingItem ? "Ubah Master Kecamatan" : "Tambah Master Kecamatan"}
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
                placeholder="740511"
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama Kecamatan *
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
                placeholder="Laeya"
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
                placeholder="laeya"
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Alamat Kantor Kecamatan
            </label>
            <input
              type="text"
              value={form.office_address}
              onChange={(e) =>
                setForm({ ...form, office_address: e.target.value })
              }
              className="admin-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Telepon</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Jam Layanan
              </label>
              <input
                type="text"
                value={form.service_hours}
                onChange={(e) =>
                  setForm({ ...form, service_hours: e.target.value })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    latitude: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    longitude: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="admin-input w-full rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Visi</label>
            <textarea
              rows={2}
              value={form.vision}
              onChange={(e) => setForm({ ...form, vision: e.target.value })}
              className="admin-input w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
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
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) =>
                  setForm({ ...form, is_default: e.target.checked })
                }
                className="rounded accent-yellow-400"
              />
              Jadikan Kecamatan Default Portal Publik
            </label>
          </div>

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
