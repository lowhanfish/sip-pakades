"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { PaginationBar } from "@/app/(admin)/_components/ui/PaginationBar";
import { useAuthStore } from "@/store/useAuthStore";
import { confirmDeleteAlert } from "@/lib/show_swall";
import { DesaItem } from "./types";
import { useDeleteDesa, useDesaList } from "./hooks/crud";
import { useKecamatanOption } from "../kecamatan/hooks/crud";
import { FormDesaModal } from "./components/FormDesaModal";
import { DetailDesaModal } from "./components/DetailDesaModal";

export default function MasterDesaPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate =
    user?.role === "superadmin_kab" || user?.role === "camat_sekcam" || user?.role === "admin_kecamatan";

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DesaItem | null>(null);
  const [detailItem, setDetailItem] = useState<DesaItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: districtOptions } = useKecamatanOption();
  const { data, isLoading, isError, error } = useDesaList(
    page,
    limit,
    debouncedSearch,
    districtId,
    typeFilter
  );
  const deleteMutation = useDeleteDesa();

  async function handleDelete(item: DesaItem) {
    const ok = await confirmDeleteAlert(
      `${item.type === "kelurahan" ? "Kelurahan" : "Desa"} ${item.name}`
    );
    if (ok) {
      await deleteMutation.mutateAsync(item.id);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Master Desa / Kelurahan</h1>
            <p className="text-xs opacity-75">
              Daftar desa dan kelurahan berjenjang per kecamatan (Pilot Kec. Laeya: 17 wilayah)
            </p>
          </div>
          {canMutate && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Desa/Kelurahan
            </button>
          )}
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-55" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari kode atau nama desa..."
              className="admin-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={districtId}
            onChange={(e) => {
              setDistrictId(e.target.value);
              setPage(1);
            }}
            className="admin-input rounded-xl px-3 py-2 text-xs"
          >
            <option value="">Semua Kecamatan</option>
            {(districtOptions ?? []).map((opt) => (
              <option key={opt.id} value={opt.id}>
                Kec. {opt.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input rounded-xl px-3 py-2 text-xs"
          >
            <option value="">Semua Jenis (Desa & Kelurahan)</option>
            <option value="kelurahan">Kelurahan</option>
            <option value="desa">Desa</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">
            Memuat data desa/kelurahan...
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-xs text-rose-500">
            {(error as Error)?.message || "Gagal memuat data."}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-10 text-center text-xs opacity-70">
            Belum ada data desa/kelurahan yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Wilayah</th>
                  <th className="py-2.5 px-3">Kecamatan</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Penduduk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-sky-400/10 hover:bg-sky-500/5 transition"
                  >
                    <td className="py-3 px-3 font-mono">{item.code}</td>
                    <td className="py-3 px-3 font-semibold">{item.name}</td>
                    <td className="py-3 px-3">Kec. {item.district_name}</td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={item.type}
                        label={item.type === "kelurahan" ? "Kelurahan" : "Desa"}
                      />
                    </td>
                    <td className="py-3 px-3">
                      {item.population_total.toLocaleString("id-ID")} jiwa
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={item.is_active ? "active" : "inactive"}
                        label={item.is_active ? "Aktif" : "Nonaktif"}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          title="Detail"
                          className="p-1.5 rounded-lg hover:bg-sky-500/15 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canMutate && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setFormOpen(true);
                              }}
                              title="Ubah"
                              className="p-1.5 rounded-lg hover:bg-yellow-400/20 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                              className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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

      <FormDesaModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingItem={editingItem}
      />
      <DetailDesaModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
      />
    </div>
  );
}
