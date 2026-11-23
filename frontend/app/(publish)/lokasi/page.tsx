"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import {
  usePublicOverview,
  usePublicTourism,
  usePublicVillages,
} from "../hooks/usePublishData";

const DistrictMap = dynamic(() => import("@/components/maps/DistrictMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[440px] rounded-2xl bg-sky-100/70 animate-pulse flex items-center justify-center text-xs text-sky-700">
      Memuat peta interaktif...
    </div>
  ),
});

export default function LokasiPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: overviewRes } = usePublicOverview(slug);
  const { data: villagesRes } = usePublicVillages(slug, "", "", 50);
  const { data: tourismRes } = usePublicTourism(slug);

  const district = overviewRes?.data?.district;
  const villages = useMemo(() => villagesRes?.data ?? [], [villagesRes?.data]);
  const tourism = useMemo(() => tourismRes?.data ?? [], [tourismRes?.data]);

  const markers = useMemo(() => {
    const list = [];
    if (district?.latitude && district?.longitude) {
      list.push({
        id: district.id,
        title: `Kantor Kecamatan ${district.name}`,
        subtitle: district.office_address ?? "",
        latitude: district.latitude,
        longitude: district.longitude,
        kind: "office" as const,
      });
    }
    for (const v of villages) {
      if (v.latitude && v.longitude) {
        list.push({
          id: v.id,
          title: `${v.type === "kelurahan" ? "Kel." : "Desa"} ${v.name}`,
          subtitle: `${v.population_total.toLocaleString("id-ID")} jiwa`,
          latitude: v.latitude,
          longitude: v.longitude,
          kind: "village" as const,
        });
      }
    }
    for (const t of tourism) {
      list.push({
        id: t.id,
        title: `Wisata: ${t.name}`,
        subtitle: t.category_name,
        latitude: t.latitude,
        longitude: t.longitude,
        kind: "tourism" as const,
      });
    }
    return list;
  }, [district, villages, tourism]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-10 space-y-8">
      <div className="clay-card p-6 md:p-10 space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/90 border border-yellow-300 text-xs font-bold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          Peta Wilayah &amp; Kontak Resmi
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Lokasi Kantor Kecamatan {district?.name ?? "Laeya"}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          Peta interaktif titik koordinat Kantor Kecamatan, sebaran 17 desa dan kelurahan, serta objek destinasi wisata lokal Kabupaten Konawe Selatan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Subtle3DCard className="lg:col-span-8 p-4">
          <DistrictMap
            centerLat={district?.latitude ?? -4.2738}
            centerLng={district?.longitude ?? 122.4664}
            zoom={11}
            markers={markers}
            heightClass="h-[440px]"
          />
        </Subtle3DCard>

        <Subtle3DCard className="lg:col-span-4 p-6 space-y-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Informasi Pelayanan
          </h2>
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">Alamat Kantor</div>
                <p>{district?.office_address ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">Jam Pelayanan SIP-PAKADES</div>
                <p>{district?.service_hours ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">Telepon</div>
                <p>{district?.phone ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">Email Resmi</div>
                <p>{district?.email ?? "-"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-sky-50/90 border border-sky-200 p-4 space-y-1.5 text-[11px]">
            <div className="font-bold text-slate-900">Legenda Peta</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
              <span>Kantor Kecamatan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
              <span>Desa / Kelurahan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span>Destinasi Wisata</span>
            </div>
          </div>
        </Subtle3DCard>
      </div>
    </div>
  );
}
