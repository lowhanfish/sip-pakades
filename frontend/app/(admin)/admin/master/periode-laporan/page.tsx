import { SimpleMasterManager } from "@/app/(admin)/_components/ui/SimpleMasterManager";

export default function MasterPeriodeLaporanPage() {
  return (
    <SimpleMasterManager
      slug="periode-laporan"
      title="Master Periode & Tenggat Triwulanan"
      subtitle="Pengaturan tahun, triwulan (TW I–IV), dan batas waktu pelaporan."
      extraFields={[
        { key: "period_year", label: "Tahun", type: "number" },
        { key: "period_quarter", label: "Triwulan (1-4)", type: "number" },
      ]}
    />
  );
}
