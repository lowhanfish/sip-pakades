"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { ApiEnvelope } from "@/types/global";
import { CitizenSessionData } from "@/types/citizen";
import { CITIZEN_API, CitizenApiError, citizenFetch } from "@/lib/api_citizen";
import { useCitizenStore } from "@/store/useCitizenStore";
import { usePublicDistrictStore } from "@/store/usePublicDistrictStore";
import { usePublicDistricts, usePublicVillages } from "@/app/(publish)/hooks/usePublishData";
import { Field, INPUT_CLS, fieldErrorMap } from "../../_components/form";

type Mode = "masuk" | "daftar";

/** Hanya izinkan kembali ke halaman portal warga, agar tidak menjadi pengalihan terbuka. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/masyarakat/") && !next.startsWith("//") ? next : "/masyarakat/dashboard";
}

function AuthCard() {
  const router = useRouter();
  const params = useSearchParams();
  const setCitizen = useCitizenStore((s) => s.setCitizen);
  const status = useCitizenStore((s) => s.status);
  const load = useCitizenStore((s) => s.load);
  const slug = usePublicDistrictStore((s) => s.selectedSlug);
  const { data: districtsRes } = usePublicDistricts();
  const { data: villagesRes } = usePublicVillages(slug, "", "", 100);
  const districtId = districtsRes?.data?.find((d) => d.slug === slug)?.id;
  const villages = villagesRes?.data ?? [];

  const [mode, setMode] = useState<Mode>("masuk");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [villageId, setVillageId] = useState("");

  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (status === "loading") void load();
    if (status === "authenticated") router.replace(next);
  }, [status, load, router, next]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setErrors({});
    try {
      const res =
        mode === "masuk"
          ? await citizenFetch<ApiEnvelope<CitizenSessionData>>(CITIZEN_API.login, {
              method: "POST",
              body: { email, password },
              noRefresh: true,
            })
          : await citizenFetch<ApiEnvelope<CitizenSessionData>>(CITIZEN_API.register, {
              method: "POST",
              body: {
                email,
                password,
                full_name: fullName,
                phone: phone || null,
                district_id: districtId ?? null,
                village_id: villageId || null,
              },
              noRefresh: true,
            });
      setCitizen(res.data.citizen);
      router.replace(next);
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

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="clay-card card-accent space-y-5 p-6 sm:p-7">
        <div className="flex items-center gap-4">
          <Image src="/img/logo-konsel.webp" alt="" width={40} height={48} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">Portal Warga</p>
            <h1 className="text-2xl text-slate-900">
              {mode === "masuk" ? "Masuk Akun Warga" : "Daftar Akun Warga"}
            </h1>
          </div>
        </div>

        <div role="tablist" aria-label="Masuk atau daftar" className="grid grid-cols-2 gap-1 rounded-full bg-slate-100/80 p-1">
          {(["masuk", "daftar"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setFormError("");
                setErrors({});
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === m ? "bg-white text-sky-900 shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m === "masuk" ? "Masuk" : "Daftar Baru"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === "daftar" && (
            <Field label="Nama Lengkap" required error={errors.full_name}>
              {({ id, describedBy, invalid }) => (
                <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                  autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              )}
            </Field>
          )}
          <Field label="Email" required error={errors.email}>
            {({ id, describedBy, invalid }) => (
              <input id={id} type="email" aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
          </Field>
          {mode === "daftar" && (
            <>
              <Field label="Nomor HP" hint="Opsional. Contoh: 081234567890" error={errors.phone}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} type="tel" aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                    autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                )}
              </Field>
              <Field label="Desa / Kelurahan" hint="Tempat Anda terdaftar sebagai warga." error={errors.village_id}>
                {({ id, describedBy, invalid }) => (
                  <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                    value={villageId} onChange={(e) => setVillageId(e.target.value)}>
                    <option value="">Pilih desa/kelurahan…</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.type === "kelurahan" ? "Kel." : "Desa"} {v.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </>
          )}
          <Field
            label="Kata Sandi"
            required
            hint={mode === "daftar" ? "Minimal 8 karakter, memuat huruf dan angka." : undefined}
            error={errors.password}
          >
            {({ id, describedBy, invalid }) => (
              <input id={id} type="password" aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
                autoComplete={mode === "masuk" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            )}
          </Field>

          {formError && !Object.keys(errors).length && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </p>
          )}

          <button type="submit" disabled={busy} className="clay-btn clay-btn-sky w-full py-3 text-sm disabled:opacity-60">
            {mode === "masuk" ? <ArrowRight className="h-4 w-4" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
            {busy ? "Memproses…" : mode === "masuk" ? "Masuk ke Akun" : "Buat Akun"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function MasukPage() {
  return (
    <div className="container-page py-10">
      <Suspense fallback={<p className="py-20 text-center text-sm text-slate-600">Memuat…</p>}>
        <AuthCard />
      </Suspense>
    </div>
  );
}
