"use client";

import { PageHero } from "@/components/motion/PageHero";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { CheckCircle2, Clock, FileCheck2, Search, Sparkles } from "lucide-react";
import { Subtle3DCard } from "@/components/three/Subtle3DCard";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import {
  usePublicServiceTypes,
  useTrackServiceRequest,
} from "../hooks/usePublishData";
import { formatDateTimeId } from "@/utilities/pagination";

const SAMPLE_REG_NUMBERS = [
  "SIP-740511-2026-0042",
  "SIP-740511-2026-0041",
  "SIP-740511-2026-0040",
];

export default function LayananPage() {
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: typesRes } = usePublicServiceTypes(slug);
  const serviceTypes = typesRes?.data ?? [];

  const [inputCode, setInputCode] = useState("SIP-740511-2026-0042");
  const [activeCode, setActiveCode] = useState("SIP-740511-2026-0042");
  const trackQuery = useTrackServiceRequest(activeCode);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setActiveCode(inputCode.trim());
  }

  return (
    <>
      <PageHero
        eyebrow="Pelayanan Administrasi Kecamatan"
        title="Persyaratan Layanan &amp; Lacak Permohonan"
        description="Persyaratan dokumen layanan terpadu serta pelacakan progres berkas secara transparan, akuntabel, dan aman."
        image="/img/pelayanan-dokumen.webp"
      />
    <div className="container-page pt-7 pb-8 space-y-6">

      {/* Lacak Status */}
      <Subtle3DCard className="p-6 md:p-8 space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl text-slate-900">
            Lacak Status Permohonan Layanan
          </h2>
          <p className="text-sm text-slate-600">
            Data pribadi pemohon (NIK &amp; dokumen lampiran) dilindungi dan tidak ditampilkan ke publik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Masukkan Nomor Registrasi (mis. SIP-740511-2026-0042)"
            className="clay-input flex-1 px-4 py-2.5 text-sm text-slate-900"
          />
          <button
            type="submit"
            className="clay-btn clay-btn-sky px-6 py-2.5 text-sm"
          >
            <Search className="w-4 h-4" />
            Lacak Berkas
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 font-semibold">Contoh kode uji:</span>
          {SAMPLE_REG_NUMBERS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setInputCode(code);
                setActiveCode(code);
              }}
              className="clay-pill px-3 py-1 font-mono text-xs text-slate-800 hover:scale-105 transition cursor-pointer"
            >
              {code}
            </button>
          ))}
        </div>

        {trackQuery.isFetching && (
          <div className="text-sm text-sky-700">Memeriksa status berkas...</div>
        )}
        {trackQuery.isError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
            {(trackQuery.error as Error).message}
          </div>
        )}
        {trackQuery.data?.data && (
          <div className="rounded-2xl bg-white/85 border border-sky-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
              <div>
                <div className="text-sm font-mono font-bold text-sky-700">
                  {trackQuery.data.data.registration_number}
                </div>
                <div className="text-xl text-slate-900">
                  {trackQuery.data.data.service_type_name}
                </div>
              </div>
              <span className="self-start px-3 py-1 rounded-full bg-amber-100 text-slate-900 font-extrabold uppercase text-sm">
                {trackQuery.data.data.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-slate-500">Pemohon (Masked)</div>
                <div className="font-bold">{trackQuery.data.data.applicant_name_masked}</div>
              </div>
              <div>
                <div className="text-slate-500">Asal Wilayah</div>
                <div className="font-bold">
                  {trackQuery.data.data.village_name}, Kec.{" "}
                  {trackQuery.data.data.district_name}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Target SLA</div>
                <div className="font-bold">
                  {trackQuery.data.data.sla_days} hari kerja (s.d.{" "}
                  {formatDateTimeId(trackQuery.data.data.sla_due_at)})
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-sm font-bold text-slate-900">
                Riwayat Progres Berkas
              </div>
              <div className="space-y-2">
                {trackQuery.data.data.timeline.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl bg-sky-50/70 border border-sky-100 p-3 text-sm"
                  >
                    <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold uppercase text-sky-800">
                        {step.status.replace("_", " ")} •{" "}
                        <span className="font-normal text-slate-500">
                          {formatDateTimeId(step.changed_at)}
                        </span>
                      </div>
                      <div className="text-slate-700">{step.public_note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Subtle3DCard>

      {/* Daftar Persyaratan 3 Layanan Utama */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Standar Persyaratan Layanan Kecamatan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {serviceTypes.map((srv, idx) => (
            <Subtle3DCard key={srv.id} delay={idx * 0.05} className="card-lift card-accent p-6 flex flex-col space-y-4">
              <span className="pointer-events-none absolute right-5 top-1 select-none text-7xl font-bold leading-none text-sky-100/80" style={{ fontFamily: "var(--font-display)" }}>
                {idx + 1}
              </span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div className="relative">
                <h3 className="text-xl text-slate-900 leading-snug">{srv.name}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{srv.description}</p>
              </div>
              <div className="relative flex-1 space-y-2 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Berkas persyaratan</div>
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {srv.requirements.map((req) => (
                    <li key={req.code} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {req.label}{" "}
                        {!req.required && <span className="text-slate-400">(opsional)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative flex items-center gap-1.5 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Estimasi {srv.sla_days} hari kerja
              </div>
            </Subtle3DCard>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
