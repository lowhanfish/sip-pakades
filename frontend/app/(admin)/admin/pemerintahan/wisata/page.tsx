"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse } from "@/types/global";
import { PublicTourismItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";

export default function PemerintahanWisataPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pemerintahan-wisata"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicTourismItem>>(
        `${baseUrl}/api/v1/admin/pemerintahan/wisata/read`
      ),
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
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Destinasi Wisata Daerah</h1>
        <p className="text-xs opacity-75">
          Katalog destinasi wisata lokal yang tampil pada portal publik (gambar terkonversi otomatis ke WebP).
        </p>
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
    </div>
  );
}
