"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ApiEnvelope } from "@/types/global";
import { CitizenRequest, CitizenServiceItem } from "@/types/citizen";
import { CITIZEN_API, CitizenApiError, citizenFetch } from "@/lib/api_citizen";
import { useCitizenStore } from "@/store/useCitizenStore";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicVillages } from "@/app/(publish)/hooks/usePublishData";
import { CitizenShell } from "../../../_components/citizen-shell";
import { DynamicInput } from "../../../_components/dynamic-input";
import { Field, INPUT_CLS, fieldErrorMap } from "../../../_components/form";

function ServiceForm() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const citizen = useCitizenStore((s) => s.citizen);
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: villagesRes } = usePublicVillages(slug, "", "", 100);
  const villages = villagesRes?.data ?? [];

  const services = useQuery({
    queryKey: ["citizen-services"],
    queryFn: () => citizenFetch<ApiEnvelope<CitizenServiceItem[]>>(CITIZEN_API.services),
  });
  const service = services.data?.data.find((s) => s.id === serviceId);

  const [villageId, setVillageId] = useState(citizen?.village_id ?? "");
  const [nik, setNik] = useState("");
  const [letterNo, setLetterNo] = useState("");
  const [address, setAddress] = useState("");
  const [data, setData] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setErrors({});
    try {
      const res = await citizenFetch<ApiEnvelope<CitizenRequest>>(CITIZEN_API.requests, {
        method: "POST",
        body: {
          service_type_id: serviceId,
          village_id: villageId || null,
          applicant_nik: citizen?.nik_masked ? null : nik || null,
          applicant_address: address || null,
          village_cover_letter_no: letterNo || null,
          data,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["citizen-requests"] });
      router.replace(`/masyarakat/permohonan/${res.data.id}`);
    } catch (err) {
      if (err instanceof CitizenApiError) {
        setErrors(fieldErrorMap(err.fieldErrors));
        setFormError(err.message);
      } else {
        setFormError("Tidak dapat terhubung ke server. Coba lagi.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (services.isLoading) return <p className="py-16 text-center text-sm text-slate-600" role="status">Memuat formulir…</p>;
  if (!service)
    return (
      <div className="clay-card space-y-3 px-6 py-12 text-center">
        <h1 className="text-xl text-slate-900">Layanan tidak tersedia</h1>
        <p className="text-sm text-slate-600">Layanan ini tidak ditemukan atau belum dibuka di kecamatan Anda.</p>
        <Link href="/masyarakat/dashboard" className="clay-btn clay-btn-sky mx-auto px-5 py-2.5 text-sm">Kembali ke Dashboard</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/masyarakat/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
      </Link>

      <form onSubmit={submit} noValidate className="clay-card card-accent space-y-6 p-6 sm:p-7">
        <header className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">Langkah 1 dari 2 · Isi formulir</p>
          <h1 className="text-2xl text-slate-900">{service.name}</h1>
          <p className="text-sm text-slate-600">{service.description}</p>
        </header>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-slate-900">1. Data pemohon</legend>
          <p className="text-xs text-slate-500">Nama dan data akun terisi otomatis dari profil Anda.</p>
          <Field label="Nama Pemohon">
            {({ id }) => <input id={id} className={`${INPUT_CLS} opacity-80`} value={citizen?.full_name ?? ""} readOnly />}
          </Field>
          <Field
            label="NIK"
            required={!citizen?.nik_masked}
            hint={citizen?.nik_masked ? "Diambil dari profil Anda." : "16 digit sesuai KTP. Anda juga bisa menyimpannya di Profil Saya."}
            error={errors.applicant_nik}
          >
            {({ id, describedBy, invalid }) =>
              citizen?.nik_masked ? (
                <input id={id} className={`${INPUT_CLS} opacity-80`} value={citizen.nik_masked} readOnly aria-describedby={describedBy} />
              ) : (
                <input id={id} inputMode="numeric" maxLength={16} aria-describedby={describedBy} aria-invalid={invalid}
                  className={INPUT_CLS} placeholder="16 digit NIK" value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))} />
              )
            }
          </Field>
          <Field label="Desa / Kelurahan" required error={errors.village_id}>
            {({ id, describedBy, invalid }) => (
              <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                value={villageId} onChange={(e) => setVillageId(e.target.value)} required>
                <option value="">Pilih desa/kelurahan…</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.type === "kelurahan" ? "Kel." : "Desa"} {v.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Alamat" error={errors.applicant_address}>
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                autoComplete="street-address" maxLength={255} value={address} onChange={(e) => setAddress(e.target.value)} />
            )}
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-bold text-slate-900">2. Data permohonan</legend>
          {service.requires_village_letter && (
            <Field label="Nomor Surat dari Desa/Kelurahan" required
              hint="Layanan ini memerlukan surat dari desa/kelurahan Anda. Fotonya diunggah pada langkah berikutnya."
              error={errors.village_cover_letter_no}>
              {({ id, describedBy, invalid }) => (
                <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                  maxLength={100} value={letterNo} onChange={(e) => setLetterNo(e.target.value)} />
              )}
            </Field>
          )}
          {service.form_fields.map((def) => (
            <Field key={def.key} label={def.label} required={def.required} error={errors[def.key]}>
              {({ id, describedBy, invalid }) => (
                <DynamicInput def={def} id={id} describedBy={describedBy} invalid={invalid}
                  value={data[def.key] ?? ""} onChange={(v) => setData((d) => ({ ...d, [def.key]: v }))} />
              )}
            </Field>
          ))}
        </fieldset>

        {formError && !Object.keys(errors).length && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Link href="/masyarakat/dashboard" className="clay-btn clay-btn-glass px-5 py-2.5 text-sm">Batal</Link>
          <button type="submit" disabled={busy} className="clay-btn clay-btn-sky px-5 py-2.5 text-sm disabled:opacity-60">
            {busy ? "Menyimpan…" : "Simpan & Lanjut Unggah Berkas"} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AjukanPage() {
  return (
    <CitizenShell>
      <ServiceForm />
    </CitizenShell>
  );
}
