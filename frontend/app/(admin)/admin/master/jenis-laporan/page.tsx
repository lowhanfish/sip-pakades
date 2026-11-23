import { SimpleMasterManager } from "@/app/(admin)/_components/ui/SimpleMasterManager";

export default function MasterJenisLaporanPage() {
  return (
    <SimpleMasterManager
      slug="jenis-laporan"
      title="Master Jenis Pelaporan Triwulanan"
      subtitle="Daftar jenis laporan rutin triwulanan dari desa/kelurahan ke kecamatan."
    />
  );
}
