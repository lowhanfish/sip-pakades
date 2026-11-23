import { SimpleMasterManager } from "@/app/(admin)/_components/ui/SimpleMasterManager";

export default function MasterJenisLayananPage() {
  return (
    <SimpleMasterManager
      slug="jenis-layanan"
      title="Master Jenis Layanan SIP-PAKADES"
      subtitle="Daftar layanan administrasi kecamatan beserta target SLA (hari kerja)."
      extraFields={[{ key: "sla_days", label: "Target SLA (Hari)", type: "number" }]}
    />
  );
}
