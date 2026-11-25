"use client";

import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { PaginationBar } from "@/app/(admin)/_components/ui/PaginationBar";
import { useAuthStore } from "@/store/useAuthStore";
import { confirmDeleteAlert } from "@/lib/show_swall";
import { KecamatanItem } from "./types";
import { useDeleteKecamatan, useKecamatanList } from "./hooks/crud";
import { FormKecamatanModal } from "./components/FormKecamatanModal";
import { DetailKecamatanModal } from "./components/DetailKecamatanModal";

export default function MasterKecamatanPage() {
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === "superadmin_kab"; // tambah & hapus: tingkat kabupaten
  // Camat boleh memperbarui profil kecamatannya sendiri.
  const canEdit = (item: KecamatanItem) =>
    canMutate || (user?.role === "camat_sekcam" && user.district_id === item.id);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KecamatanItem | null>(null);
  const [detailItem, setDetailItem] = useState<KecamatanItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useKecamatanList(
    page,
    limit,
    debouncedSearch
  );
  const deleteMutation = useDeleteKecamatan();

  async function handleDelete(item: KecamatanItem) {
    const ok = await confirmDeleteAlert(`Kecamatan ${item.name}`);
    if (ok) {
      await deleteMutation.mutateAsync(item.id);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Master Kecamatan</h1>
            <p className="text-xs opacity-75">
              Pengelolaan daftar kecamatan Kabupaten Konawe Selatan (Pilot: Laeya)
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
              Tambah Kecamatan
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
            placeholder="Cari kode, nama, atau slug kecamatan..."
            className="admin-input w-full rounded-xl pl-9 pr-3 py-2 text-xs"
          />
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-xs opacity-70">
            Memuat data kecamatan...
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-xs text-rose-500">
            {(error as Error)?.message || "Gagal memuat data."}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-10 text-center text-xs opacity-70">
            Belum ada data kecamatan yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Kecamatan</th>
                  <th className="py-2.5 px-3">Desa/Kel.</th>
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
                    <td className="py-3 px-3">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.is_default && (
                          <StatusBadge variant="default" label="Default" />
                        )}
                      </div>
                      <div className="text-[11px] opacity-65 truncate max-w-xs">
                        {item.office_address || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {item.village_count ?? 0} wilayah
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
                        {canEdit(item) && (
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
                        )}
                        {canMutate && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus"
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {data && (
          <PaginationBar
            page={page}
            limit={limit}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </GlassCard>

      <FormKecamatanModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingItem={editingItem}
      />
      <DetailKecamatanModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
      />
    </div>
  );
}
