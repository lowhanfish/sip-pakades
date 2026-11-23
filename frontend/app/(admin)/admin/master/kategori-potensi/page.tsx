import { SimpleMasterManager } from "@/app/(admin)/_components/ui/SimpleMasterManager";

export default function MasterKategoriPotensiPage() {
  return (
    <SimpleMasterManager
      slug="kategori-potensi"
      title="Master Kategori Potensi Wilayah"
      subtitle="Klasifikasi sektor potensi wilayah beserta satuan pengukuran standarnya."
      extraFields={[{ key: "default_unit", label: "Satuan Default", type: "text" }]}
    />
  );
}
