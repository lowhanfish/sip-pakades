"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, History, Inbox, Send, TriangleAlert } from "lucide-react";
import { ApiEnvelope } from "@/types/global";
import { CitizenRequestPage, CitizenServiceItem } from "@/types/citizen";
import { CITIZEN_API, citizenFetch } from "@/lib/api_citizen";
import { useCitizenStore } from "@/store/useCitizenStore";
import { formatDateTimeId } from "@/utilities/pagination";
import { CitizenShell } from "../../_components/citizen-shell";
import { StatusBadge } from "../../_components/status";

type Tab = "ajukan" | "riwayat";

const CATEGORY_LABEL: Record<CitizenServiceItem["category"], string> = {
  perizinan: "Perizinan",
  nonperizinan: "Nonperizinan",
  rekomendasi: "Rekomendasi",
  legalisasi: "Legalisasi",
};

function Dashboard() {
  const citizen = useCitizenStore((s) => s.citizen);
  const [tab, setTab] = useState<Tab>("ajukan");

  const services = useQuery({
    queryKey: ["citizen-services"],
    queryFn: () => citizenFetch<ApiEnvelope<CitizenServiceItem[]>>(CITIZEN_API.services),
  });
  const requests = useQuery({
    queryKey: ["citizen-requests"],
    queryFn: () => citizenFetch<CitizenRequestPage>(`${CITIZEN_API.requests}?limit=50`),
  });

  const list = services.data?.data ?? [];
  const history = requests.data?.data ?? [];
  const initials = (citizen?.full_name ?? "?").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <>
      <section className="clay-card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-lg font-extrabold text-white" aria-hidden>
          {initials}
        </div>
        <div className="min-w-[12rem] flex-1">
          <h1 className="break-words text-xl text-slate-900">Selamat datang, {citizen?.full_name}</h1>
          <p className="break-all text-sm text-slate-600 sm:break-normal">
            {citizen?.email}
            {citizen?.village_name ? ` · ${citizen.village_name}` : ""}
            {citizen?.district_name ? ` · Kec. ${citizen.district_name}` : ""}
          </p>
        </div>
        <Link href="/masyarakat/profil" className="clay-btn clay-btn-glass px-4 py-2 text-sm">
          Kelola Profil <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {citizen && !citizen.nik_masked && (
        <div role="note" className="flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            NIK belum dilengkapi. Lengkapi di{" "}
            <Link href="/masyarakat/profil" className="font-semibold underline">Profil Saya</Link>{" "}
            agar formulir terisi otomatis saat mengajukan surat.
          </p>
        </div>
      )}

      <div role="tablist" aria-label="Menu dashboard" className="flex flex-wrap gap-2">
        {([
          { id: "ajukan", label: "Ajukan Surat Baru", icon: Send, count: list.length },
          { id: "riwayat", label: "Riwayat Permohonan", icon: History, count: history.length },
        ] as const).map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`clay-btn px-4 py-2.5 text-sm ${tab === id ? "clay-btn-sky" : "clay-btn-glass"}`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-white/25" : "bg-sky-100 text-sky-800"}`}>{count}</span>
          </button>
        ))}
      </div>

      {tab === "ajukan" && (
        <section aria-label="Layanan tersedia" className="space-y-4">
          {services.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-600" role="status">Memuat layanan…</p>
          ) : services.isError ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Layanan gagal dimuat. Muat ulang halaman ini.
            </p>
          ) : list.length === 0 ? (
            <div className="clay-card flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Inbox className="h-8 w-8 text-slate-400" aria-hidden />
              <h2 className="text-lg text-slate-900">Belum ada layanan yang dibuka</h2>
              <p className="max-w-md text-sm text-slate-600">
                Kecamatan Anda belum membuka layanan secara daring. Silakan datang langsung ke kantor
                kecamatan, atau cek kembali beberapa saat lagi.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <article key={s.id} className="clay-card flex flex-col gap-3 p-5">
                  <span className="clay-pill w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
                    {CATEGORY_LABEL[s.category]}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{s.name}</h2>
                  <p className="flex-1 text-sm leading-relaxed text-slate-600">{s.description}</p>
                  <p className="text-xs text-slate-500">Estimasi proses {s.sla_days} hari kerja</p>
                  <Link href={`/masyarakat/ajukan/${s.id}`} className="clay-btn clay-btn-sky px-4 py-2.5 text-sm">
                    Ajukan Surat <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "riwayat" && (
        <section aria-label="Riwayat permohonan" className="space-y-3">
          {requests.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-600" role="status">Memuat riwayat…</p>
          ) : history.length === 0 ? (
            <div className="clay-card flex flex-col items-center gap-2 px-6 py-12 text-center">
              <FileText className="h-8 w-8 text-slate-400" aria-hidden />
              <h2 className="text-lg text-slate-900">Belum ada riwayat permohonan</h2>
              <p className="text-sm text-slate-600">Permohonan yang Anda ajukan akan muncul di sini beserta statusnya.</p>
            </div>
          ) : (
            history.map((r) => (
              <Link key={r.id} href={`/masyarakat/permohonan/${r.id}`} className="clay-card flex flex-wrap items-center gap-3 p-4 transition hover:-translate-y-0.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{r.service_type_name}</p>
                  <p className="text-xs text-slate-500">
                    {r.registration_number ?? "Belum dikirim"} · {formatDateTimeId(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
                <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
              </Link>
            ))
          )}
        </section>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <CitizenShell>
      <Dashboard />
    </CitizenShell>
  );
}
