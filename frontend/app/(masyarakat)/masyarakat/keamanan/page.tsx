"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { CITIZEN_API, CitizenApiError, citizenFetch } from "@/lib/api_citizen";
import { swallAlert } from "@/lib/show_swall";
import { CitizenShell } from "../../_components/citizen-shell";
import { Field, INPUT_CLS, fieldErrorMap } from "../../_components/form";

function SecurityForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    if (next !== confirm) {
      setErrors({ confirm: "Konfirmasi kata sandi tidak sama." });
      return;
    }
    setBusy(true);
    try {
      await citizenFetch(CITIZEN_API.changePassword, {
        method: "POST",
        body: { current_password: current, new_password: next },
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      await swallAlert("Kata sandi diperbarui", "success", "Perangkat lain telah dikeluarkan dari akun Anda.");
    } catch (err) {
      if (err instanceof CitizenApiError) {
        const map = fieldErrorMap(err.fieldErrors);
        if (Object.keys(map).length) {
          setErrors({ new_password: map.new_password ?? err.message });
        } else if (err.status === 401) {
          setErrors({ current_password: err.message });
        } else {
          setErrors({ new_password: err.message });
        }
      } else {
        await swallAlert("Gagal menyimpan", "error", "Tidak dapat terhubung ke server.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="clay-card card-accent mx-auto max-w-lg space-y-5 p-6 sm:p-7">
      <header>
        <h1 className="text-2xl text-slate-900">Keamanan Akun</h1>
        <p className="text-sm text-slate-600">Ganti kata sandi secara berkala. Setelah diganti, perangkat lain akan keluar otomatis.</p>
      </header>
      <Field label="Kata Sandi Saat Ini" required error={errors.current_password}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="password" autoComplete="current-password" aria-describedby={describedBy} aria-invalid={invalid}
            className={INPUT_CLS} value={current} onChange={(e) => setCurrent(e.target.value)} required />
        )}
      </Field>
      <Field label="Kata Sandi Baru" required hint="Minimal 8 karakter, memuat huruf dan angka." error={errors.new_password}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid}
            className={INPUT_CLS} value={next} onChange={(e) => setNext(e.target.value)} required />
        )}
      </Field>
      <Field label="Ulangi Kata Sandi Baru" required error={errors.confirm}>
        {({ id, describedBy, invalid }) => (
          <input id={id} type="password" autoComplete="new-password" aria-describedby={describedBy} aria-invalid={invalid}
            className={INPUT_CLS} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        )}
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="clay-btn clay-btn-sky px-5 py-2.5 text-sm disabled:opacity-60">
          <KeyRound className="h-4 w-4" aria-hidden /> {busy ? "Menyimpan…" : "Ganti Kata Sandi"}
        </button>
      </div>
    </form>
  );
}

export default function KeamananPage() {
  return (
    <CitizenShell>
      <SecurityForm />
    </CitizenShell>
  );
}
