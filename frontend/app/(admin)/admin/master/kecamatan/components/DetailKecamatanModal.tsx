"use client";

import { X } from "lucide-react";
import { KecamatanItem } from "../types";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { formatDateTimeId } from "@/utilities/pagination";

interface DetailKecamatanModalProps {
  open: boolean;
  onClose: () => void;
  item: KecamatanItem | null;
}

export function DetailKecamatanModal({
  open,
  onClose,
  item,
}: DetailKecamatanModalProps) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="admin-glass rounded-3xl w-full max-w-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-70">Detail Master Kecamatan</div>
            <h2 className="text-lg font-bold">Kecamatan {item.name}</h2>
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
            variant={item.is_active ? "active" : "inactive"}
            label={item.is_active ? "Aktif" : "Nonaktif"}
          />
          {item.is_default && (
            <StatusBadge variant="default" label="Default Portal Publik" />
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div>
            <dt className="opacity-65">Kode Wilayah</dt>
            <dd className="font-semibold">{item.code}</dd>
          </div>
          <div>
            <dt className="opacity-65">Slug</dt>
            <dd className="font-semibold">{item.slug}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="opacity-65">Alamat Kantor</dt>
            <dd className="font-semibold">{item.office_address || "-"}</dd>
          </div>
          <div>
            <dt className="opacity-65">Jam Layanan</dt>
            <dd className="font-semibold">{item.service_hours || "-"}</dd>
          </div>
          <div>
            <dt className="opacity-65">Koordinat</dt>
            <dd className="font-semibold">
              {item.latitude && item.longitude
                ? `${item.latitude}, ${item.longitude}`
                : "-"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="opacity-65">Visi</dt>
            <dd className="font-medium leading-relaxed">{item.vision || "-"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="opacity-65">Diperbarui</dt>
            <dd className="font-medium">{formatDateTimeId(item.updated_at)}</dd>
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
