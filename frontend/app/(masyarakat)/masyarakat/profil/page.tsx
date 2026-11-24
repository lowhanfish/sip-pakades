"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { ApiEnvelope } from "@/types/global";
import { CitizenProfile } from "@/types/citizen";
import { CITIZEN_API, CitizenApiError, citizenFetch } from "@/lib/api_citizen";
import { swallAlert } from "@/lib/show_swall";
import { useCitizenStore } from "@/store/useCitizenStore";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicVillages } from "@/app/(publish)/hooks/usePublishData";
import { CitizenShell } from "../../_components/citizen-shell";
import { Field, INPUT_CLS, fieldErrorMap } from "../../_components/form";

function ProfileForm() {
  const citizen = useCitizenStore((s) => s.citizen)!;
  const setCitizen = useCitizenStore((s) => s.setCitizen);
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: villagesRes } = usePublicVillages(slug, "", "", 100);
  const villages = villagesRes?.data ?? [];

  const [fullName, setFullName] = useState(citizen.full_name);
  const [phone, setPhone] = useState(citizen.phone ?? "");
  const [nik, setNik] = useState("");
  const [villageId, setVillageId] = useState(citizen.village_id ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body: Record<string, unknown> = { full_name: fullName, phone: phone || null, village_id: villageId || null };
      if (nik) body.nik = nik;
      const res = await citizenFetch<ApiEnvelope<{ citizen: CitizenProfile }>>(CITIZEN_API.profile, { method: "PATCH", body });
      setCitizen(res.data.citizen);
      setNik("");
      await swallAlert("Profil diperbarui", "success");
    } catch (err) {
      if (err instanceof CitizenApiError) {
        const map = fieldErrorMap(err.fieldErrors);
        setErrors(map);
        if (!Object.keys(map).length) await swallAlert("Gagal menyimpan", "error", err.message);
      } else {
        await swallAlert("Gagal menyimpan", "error", "Tidak dapat terhubung ke server.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="clay-card card-accent mx-auto max-w-2xl space-y-5 p-6 sm:p-7">
      <header>
        <h1 className="text-2xl text-slate-900">Profil Saya</h1>
        <p className="text-sm text-slate-600">Data ini dipakai untuk mengisi formulir permohonan secara otomatis.</p>
      </header>
      <Field label="Email" hint="Email tidak dapat diubah.">
        {({ id, describedBy }) => <input id={id} aria-describedby={describedBy} className={`${INPUT_CLS} opacity-80`} value={citizen.email} readOnly />}
      </Field>
      <Field label="Nama Lengkap" required error={errors.full_name}>
        {({ id, describedBy, invalid }) => (
          <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS} autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
        )}
      </Field>
      <Field label="Nomor HP" hint="Contoh: 081234567890" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="tel" aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS} autoComplete="tel"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
        )}
      </Field>
      <Field
        label="NIK"
        hint={citizen.nik_masked ? `Tersimpan: ${citizen.nik_masked}. Isi kolom ini hanya bila ingin menggantinya.` : "16 digit sesuai KTP. Disimpan terenkripsi."}
        error={errors.nik}
      >
        {({ id, describedBy, invalid }) => (
          <input id={id} inputMode="numeric" maxLength={16} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
            placeholder={citizen.nik_masked ?? "16 digit NIK"} value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))} />
        )}
      </Field>
      <Field label="Desa / Kelurahan" error={errors.village_id}>
        {({ id, describedBy, invalid }) => (
          <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS} value={villageId} onChange={(e) => setVillageId(e.target.value)}>
            <option value="">Belum dipilih</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>{v.type === "kelurahan" ? "Kel." : "Desa"} {v.name}</option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="clay-btn clay-btn-sky px-5 py-2.5 text-sm disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden /> {busy ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

export default function ProfilPage() {
  return (
    <CitizenShell>
      <ProfileForm />
    </CitizenShell>
  );
}
