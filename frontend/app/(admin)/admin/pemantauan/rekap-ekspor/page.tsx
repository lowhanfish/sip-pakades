"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { swallAlert } from "@/lib/show_swall";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { CompletenessRow } from "@/lib/mock/seed-admin";
import { PaginatedResponse } from "@/types/global";

const EXPORT_SCOPES = [
  {
    scope: "completeness",
    title: "Rekap Kelengkapan Data Desa/Kelurahan",
    desc: "Ringkasan keterisian profil, perangkat, potensi wilayah, dan destinasi wisata.",
  },
  {
    scope: "timeliness",
    title: "Rekap Pelaporan Triwulanan & Ketepatan Waktu",
    desc: "Status laporan per triwulan beserta indikator tepat waktu / terlambat / belum lapor.",
  },
  {
    scope: "services_sla",
    title: "Rekap Pelayanan Administrasi (PATEN) & SLA",
    desc: "Jumlah permohonan selesai, diproses, dan kepatuhan target SLA per jenis layanan.",
  },
  {
    scope: "letters_agenda",
    title: "Buku Agenda Surat Masuk, Disposisi & Surat Keluar",
    desc: "Daftar agenda persuratan resmi kecamatan dalam periode terpilih.",
  },
];

export default function RekapEksporPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const { data: compRes } = useQuery({
    queryKey: ["pemantauan-completeness"],
    queryFn: () =>
      fetchData<PaginatedResponse<CompletenessRow>>(
        `${baseUrl}/api/v1/admin/pemantauan/completeness`
      ),
  });

  function handleExportCsvPreview(title: string) {
    const rows = compRes?.data ?? [];
    const csv = [
      "Wilayah,Jenis,Perangkat,Potensi,Wisata,Kelengkapan(%)",
      ...rows.map(
        (r) =>
          `"${r.village_name}","${r.village_type}",${r.officials_count},${r.potentials_count},${r.tourism_count},${r.completeness_pct}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rekap-sip-pakades.csv";
    a.click();
    URL.revokeObjectURL(url);
    swallAlert(`Ekspor "${title}" berhasil diunduh`, "success");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Rekap Otomatis &amp; Ekspor Laporan</h1>
        <p className="text-xs opacity-75">
          Unduh ringkasan otomatis ke format Excel/CSV atau PDF (pada mode live backend menggunakan <code>openpyxl</code> &amp; kop resmi <code>logo-konsel.webp</code>).
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_SCOPES.map((item) => (
          <GlassCard key={item.scope} className="flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold">{item.title}</h2>
              <p className="text-xs opacity-75">{item.desc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExportCsvPreview(item.title)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Unduh Excel / CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  swallAlert(
                    "Siap di Backend Live",
                    "info",
                    `Ekspor PDF (${item.scope}) akan digenerate otomatis oleh FastAPI dengan kop resmi Kab. Konawe Selatan.`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3.5 py-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Unduh PDF
                <Download className="w-3 h-3" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
