"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, PaginatedResponse } from "@/types/global";
import { SimpleMasterItem } from "@/lib/mock/seed-admin";
import { calculateSkip } from "@/utilities/pagination";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { PaginationBar } from "./PaginationBar";

export interface ExtraMasterField {
  key:
    | "default_unit"
    | "sla_days"
    | "period_year"
    | "period_quarter"
    | "level"
    | "sort_order";
  label: string;
  type: "text" | "number" | "select";
  options?: Array<{ value: string; label: string }>;
}

interface SimpleMasterManagerProps {
  slug: string;
  title: string;
  subtitle: string;
  extraFields?: ExtraMasterField[];
}

export function SimpleMasterManager({
  slug,
  title,
  subtitle,
  extraFields = [],
}: SimpleMasterManagerProps) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const canMutate =
    user?.role === "superadmin_kab" || user?.role === "admin_kecamatan";

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SimpleMasterItem | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    code: "",
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryKey = [`master-${slug}`, page, limit, debouncedSearch];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchData<PaginatedResponse<SimpleMasterItem>>(
        `${baseUrl}/api/v1/admin/master/${slug}/read?skip=${calculateSkip(
          page,
          limit
        )}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, any>) =>
      editing
        ? fetchData<ApiEnvelope<SimpleMasterItem>>(
            `${baseUrl}/api/v1/admin/master/${slug}/update/${editing.id}`,
            { method: "PUT", body: payload }
          )
        : fetchData<ApiEnvelope<SimpleMasterItem>>(
            `${baseUrl}/api/v1/admin/master/${slug}/create`,
            { method: "POST", body: payload }
          ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [`master-${slug}`] });
      swallAlert(res.message || "Berhasil disimpan", "success");
      setModalOpen(false);
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchData<ApiEnvelope<{ id: string }>>(
        `${baseUrl}/api/v1/admin/master/${slug}/delete/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [`master-${slug}`] });
      swallAlert(res.message || "Berhasil dihapus", "success");
    },
    onError: (err: Error) => swallAlert("Gagal", "error", err.message),
  });

  function openCreate() {
    setEditing(null);
    const defaults: Record<string, any> = {
      code: "",
      name: "",
      description: "",
      is_active: true,
    };
    for (const f of extraFields) {
      defaults[f.key] = f.type === "number" ? 1 : f.options?.[0]?.value ?? "";
    }
    setForm(defaults);
    setModalOpen(true);
  }

  function openEdit(item: SimpleMasterItem) {
    setEditing(item);
    const next: Record<string, any> = {
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      is_active: item.is_active,
    };
    for (const f of extraFields) {
      next[f.key] = (item as any)[f.key] ?? "";
    }
    setForm(next);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await saveMutation.mutateAsync(form);
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs opacity-75">{subtitle}</p>
          </div>
          {canMutate && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Data
            </button>
          )}
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-55" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kode atau nama..."
            className="admin-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">Memuat data...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-10 text-center text-xs opacity-70">Belum ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama / Uraian</th>
                  {extraFields.map((f) => (
                    <th key={f.key} className="py-2.5 px-3">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Status</th>
                  {canMutate && <th className="py-2.5 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-sky-400/10 hover:bg-sky-500/5 transition"
                  >
                    <td className="py-3 px-3 font-mono font-semibold">{item.code}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] opacity-65">{item.description}</div>
                      )}
                    </td>
                    {extraFields.map((f) => (
                      <td key={f.key} className="py-3 px-3">
                        {String((item as any)[f.key] ?? "-")}
                      </td>
                    ))}
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={item.is_active ? "active" : "inactive"}
                        label={item.is_active ? "Aktif" : "Nonaktif"}
                      />
                    </td>
                    {canMutate && (
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-yellow-400/20 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (await confirmDeleteAlert(item.name)) {
                                await deleteMutation.mutateAsync(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <PaginationBar
            page={page}
            limit={limit}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </GlassCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">
                {editing ? `Ubah ${title}` : `Tambah ${title}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-sky-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {extraFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [f.key]:
                            f.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-sky-500"
                />
                Status Aktif
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
