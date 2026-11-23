import { SimpleMasterManager } from "@/app/(admin)/_components/ui/SimpleMasterManager";

export default function MasterJabatanPage() {
  return (
    <SimpleMasterManager
      slug="jabatan"
      title="Master Jabatan Perangkat"
      subtitle="Daftar jabatan standar pemerintahan tingkat kecamatan dan desa/kelurahan."
      extraFields={[
        {
          key: "level",
          label: "Tingkatan",
          type: "select",
          options: [
            { value: "kecamatan", label: "Kecamatan" },
            { value: "desa", label: "Desa / Kelurahan" },
          ],
        },
        { key: "sort_order", label: "Urutan", type: "number" },
      ]}
    />
  );
}
