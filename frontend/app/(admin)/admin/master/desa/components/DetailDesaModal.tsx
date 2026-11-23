"use client";

import { X } from "lucide-react";
import { DesaItem } from "../types";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { formatDateTimeId } from "@/utilities/pagination";

interface DetailDesaModalProps {
  open: boolean;
  onClose: () => void;
  item: DesaItem | null;
}

export function DetailDesaModal({ open, onClose, item }: DetailDesaModalProps) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="admin-glass rounded-3xl w-full max-w-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">Detail Master Desa/Kelurahan</div>
            <h2 className="text-lg font-bold">
              {item.type === "kelurahan" ? "Kelurahan" : "Desa"} {item.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-sky-500/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            variant={item.type}
            label={item.type === "kelurahan" ? "Kelurahan" : "Desa"}
          />
          <StatusBadge
            variant={item.is_active ? "active" : "inactive"}
            label={item.is_active ? "Aktif" : "Nonaktif"}
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs pt-2">
          <div>
            <dt className="opacity-65">Kecamatan</dt>
            <dd className="font-semibold">{item.district_name || "-"}</dd>
          </div>
          <div>
            <dt className="opacity-65">Kode Wilayah</dt>
            <dd className="font-mono font-semibold">{item.code}</dd>
          </div>
          <div>
            <dt className="opacity-65">Luas Wilayah</dt>
            <dd className="font-semibold">
              {item.area_km2 ? `${item.area_km2} km²` : "-"}
            </dd>
          </div>
          <div>
            <dt className="opacity-65">Penduduk / KK</dt>
            <dd className="font-semibold">
              {item.population_total.toLocaleString("id-ID")} jiwa /{" "}
              {item.household_total.toLocaleString("id-ID")} KK
            </dd>
          </div>
          <div>
            <dt className="opacity-65">Dusun / RW / RT</dt>
            <dd className="font-semibold">
              {item.dusun_count} / {item.rw_count} / {item.rt_count}
            </dd>
          </div>
          <div>
            <dt className="opacity-65">Diperbarui</dt>
            <dd className="font-medium">{formatDateTimeId(item.updated_at)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="opacity-65">Deskripsi</dt>
            <dd className="font-medium leading-relaxed">
              {item.description || "-"}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
