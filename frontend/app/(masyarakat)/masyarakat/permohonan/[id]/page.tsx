"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { ArrowLeft, CheckCircle2, Circle, Download, Paperclip, Pencil, Save, Send, Trash2, Upload } from "lucide-react";
import { ApiEnvelope } from "@/types/global";
import { CitizenRequest } from "@/types/citizen";
import { CITIZEN_API, CitizenApiError, citizenFetch } from "@/lib/api_citizen";
import { confirmDeleteAlert, swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";
import { CitizenShell } from "../../../_components/citizen-shell";
import { DynamicInput } from "../../../_components/dynamic-input";
import { Field, INPUT_CLS, fieldErrorMap } from "../../../_components/form";
import { StatusBadge, statusLabel } from "../../../_components/status";

const MAX_MB = 10;
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function EditForm({
  req,
  onSaved,
}: {
  req: CitizenRequest;
  onSaved: (r: CitizenRequest) => void;
}) {
  const [open, setOpen] = useState(false);
  const [letterNo, setLetterNo] = useState(req.village_cover_letter_no ?? "");
  const [address, setAddress] = useState(req.applicant_address ?? "");
  const [data, setData] = useState<Record<string, string>>(req.data);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await citizenFetch<ApiEnvelope<CitizenRequest>>(`${CITIZEN_API.requests}/${req.id}`, {
        method: "PATCH",
        body: { village_cover_letter_no: letterNo, applicant_address: address, data },
      });
      onSaved(res.data);
      setOpen(false);
      await swallAlert("Data diperbarui", "success");
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

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="clay-btn clay-btn-glass px-4 py-2 text-sm">
        <Pencil className="h-4 w-4" aria-hidden /> Ubah data permohonan
      </button>
    );

  return (
    <form onSubmit={save} noValidate className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
      <h3 className="text-sm font-bold text-slate-900">Ubah data permohonan</h3>
      {req.requires_village_letter && (
        <Field label="Nomor Surat dari Desa/Kelurahan" required error={errors.village_cover_letter_no}>
          {({ id, describedBy, invalid }) => (
            <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
              maxLength={100} value={letterNo} onChange={(e) => setLetterNo(e.target.value)} />
          )}
        </Field>
      )}
      <Field label="Alamat" error={errors.applicant_address}>
        {({ id, describedBy, invalid }) => (
          <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={INPUT_CLS}
            maxLength={255} value={address} onChange={(e) => setAddress(e.target.value)} />
        )}
      </Field>
      {(req.form_fields ?? []).map((def) => (
        <Field key={def.key} label={def.label} required={def.required} error={errors[def.key]}>
          {({ id, describedBy, invalid }) => (
            <DynamicInput def={def} id={id} describedBy={describedBy} invalid={invalid}
              value={data[def.key] ?? ""} onChange={(v) => setData((d) => ({ ...d, [def.key]: v }))} />
          )}
        </Field>
      ))}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="clay-btn clay-btn-glass px-4 py-2 text-sm">Batal</button>
        <button type="submit" disabled={busy} className="clay-btn clay-btn-sky px-4 py-2 text-sm disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden /> {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const q = useQuery({
    queryKey: ["citizen-request", id],
    queryFn: () => citizenFetch<ApiEnvelope<CitizenRequest>>(`${CITIZEN_API.requests}/${id}`),
    retry: false,
  });
  const req = q.data?.data;

  function setRequest(next: CitizenRequest) {
    queryClient.setQueryData(["citizen-request", id], { success: true, message: "OK", data: next });
    void queryClient.invalidateQueries({ queryKey: ["citizen-requests"] });
  }

  async function upload(code: string, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      await swallAlert("Berkas terlalu besar", "warning", `Ukuran maksimal ${MAX_MB} MB per berkas.`);
      return;
    }
    setBusyCode(code);
    try {
      const form = new FormData();
      form.append("doc_code", code);
      form.append("file", file);
      const res = await citizenFetch<ApiEnvelope<CitizenRequest>>(`${CITIZEN_API.requests}/${id}/dokumen`, { method: "POST", body: form });
      setRequest(res.data);
    } catch (err) {
      await swallAlert("Unggah gagal", "error", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyCode(null);
      const el = inputs.current[code];
      if (el) el.value = "";
    }
  }

  async function removeDoc(docId: string, label: string) {
    if (!(await confirmDeleteAlert(`berkas "${label}"`))) return;
    try {
      const res = await citizenFetch<ApiEnvelope<CitizenRequest>>(`${CITIZEN_API.requests}/${id}/dokumen/${docId}`, { method: "DELETE" });
      setRequest(res.data);
    } catch (err) {
      await swallAlert("Gagal menghapus", "error", err instanceof Error ? err.message : undefined);
    }
  }

  async function removeDraft() {
    if (!(await confirmDeleteAlert("draf permohonan ini"))) return;
    try {
      await citizenFetch(`${CITIZEN_API.requests}/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["citizen-requests"] });
      router.replace("/masyarakat/dashboard");
    } catch (err) {
      await swallAlert("Gagal menghapus", "error", err instanceof Error ? err.message : undefined);
    }
  }

  async function send() {
    const ok = await Swal.fire({
      title: needsFix ? "Kirim perbaikan?" : "Kirim permohonan?",
      text: needsFix
        ? "Perbaikan Anda akan diperiksa ulang oleh petugas."
        : "Setelah dikirim, data dan berkas tidak dapat diubah lagi.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim",
      cancelButtonText: "Periksa Lagi",
      confirmButtonColor: "#2563eb",
    });
    if (!ok.isConfirmed) return;
    setSending(true);
    try {
      const res = await citizenFetch<ApiEnvelope<CitizenRequest>>(`${CITIZEN_API.requests}/${id}/kirim`, { method: "POST" });
      setRequest(res.data);
      await swallAlert(needsFix ? "Perbaikan terkirim" : "Permohonan terkirim", "success", res.message);
    } catch (err) {
      if (err instanceof CitizenApiError && err.fieldErrors.length) {
        await swallAlert("Permohonan belum lengkap", "warning", err.fieldErrors.map((e) => e.message).join("\n"));
      } else {
        await swallAlert("Gagal mengirim", "error", err instanceof Error ? err.message : undefined);
      }
    } finally {
      setSending(false);
    }
  }

  if (q.isLoading) return <p className="py-16 text-center text-sm text-slate-600" role="status">Memuat permohonan…</p>;
  if (q.isError || !req)
    return (
      <div className="clay-card space-y-3 px-6 py-12 text-center">
        <h1 className="text-xl text-slate-900">Permohonan tidak ditemukan</h1>
        <Link href="/masyarakat/dashboard" className="clay-btn clay-btn-sky mx-auto px-5 py-2.5 text-sm">Kembali ke Dashboard</Link>
      </div>
    );

  const isDraft = req.status === "draf";
  const needsFix = req.status === "perlu_kelengkapan";
  const editable = isDraft || needsFix;
  const lastNote = [...req.timeline].reverse().find((t) => t.status === "perlu_kelengkapan")?.public_note;
  const missing = req.required_documents.filter((d) => d.required && !d.uploaded).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/masyarakat/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke Dashboard
      </Link>

      <header className="clay-card card-accent space-y-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
              {isDraft ? "Langkah 2 dari 2 · Unggah berkas" : "Detail permohonan"}
            </p>
            <h1 className="text-2xl text-slate-900">{req.service_type_name}</h1>
          </div>
          <StatusBadge status={req.status} />
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-slate-500">Nomor registrasi</dt><dd className="font-semibold text-slate-900">{req.registration_number ?? "Diberikan setelah dikirim"}</dd></div>
          <div><dt className="text-xs text-slate-500">Desa/Kelurahan</dt><dd className="font-semibold text-slate-900">{req.village_name ?? "-"}</dd></div>
          <div><dt className="text-xs text-slate-500">Pemohon</dt><dd className="font-semibold text-slate-900">{req.applicant_name}</dd></div>
          <div><dt className="text-xs text-slate-500">NIK</dt><dd className="font-semibold text-slate-900">{req.applicant_nik_masked ?? "-"}</dd></div>
          {req.village_cover_letter_no && <div><dt className="text-xs text-slate-500">Nomor surat desa</dt><dd className="font-semibold text-slate-900">{req.village_cover_letter_no}</dd></div>}
          {req.sla_due_at && <div><dt className="text-xs text-slate-500">Target selesai</dt><dd className="font-semibold text-slate-900">{formatDateTimeId(req.sla_due_at)}</dd></div>}
          {Object.entries(req.data).map(([k, v]) => (
            <div key={k} className="sm:col-span-2"><dt className="text-xs capitalize text-slate-500">{k.replace(/_/g, " ")}</dt><dd className="whitespace-pre-line text-slate-900">{v}</dd></div>
          ))}
        </dl>
        {editable && <EditForm key={req.updated_at} req={req} onSaved={setRequest} />}
      </header>

      {req.has_signed_letter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <div>
            <p className="font-bold">Surat Anda sudah terbit</p>
            {req.letter_number && <p className="font-mono text-xs">{req.letter_number}</p>}
            <p className="mt-1 text-xs">Ditandatangani secara elektronik. Keaslian dapat diperiksa lewat kode QR pada surat.</p>
          </div>
          <a href={`${CITIZEN_API.requests}/${id}/surat`} target="_blank" rel="noopener noreferrer" className="clay-btn clay-btn-sky px-4 py-2.5 text-sm">
            <Download className="h-4 w-4" aria-hidden /> Unduh Surat
          </a>
        </div>
      )}

      {needsFix && (
        <div role="alert" className="rounded-2xl border border-orange-300 bg-orange-50 px-5 py-4 text-sm text-orange-900">
          <p className="font-bold">Petugas meminta perbaikan</p>
          {lastNote && <p className="mt-1 whitespace-pre-line">{lastNote}</p>}
          <p className="mt-2 text-xs">Ganti berkas yang diminta di bawah ini, lalu tekan Kirim Perbaikan.</p>
        </div>
      )}

      <section className="clay-card space-y-4 p-6" aria-labelledby="berkas-h">
        <h2 id="berkas-h" className="text-lg text-slate-900">Berkas lampiran</h2>
        <p className="text-xs text-slate-500">PDF, JPG, PNG, atau WebP. Maksimal {MAX_MB} MB per berkas. Foto dari kamera HP boleh.</p>
        <ul className="space-y-3">
          {req.required_documents.map((d) => {
            const doc = req.documents.find((x) => x.doc_code === d.code);
            return (
              <li key={d.code} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
                {doc ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Sudah diunggah" /> : <Circle className="h-5 w-5 shrink-0 text-slate-400" aria-label="Belum diunggah" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{d.label}{d.required && <span className="text-red-600" aria-label="wajib"> *</span>}</p>
                  {doc ? (
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500"><Paperclip className="h-3 w-3" aria-hidden />{doc.file_name} · {formatSize(doc.file_size)}</p>
                  ) : (
                    <p className="text-xs text-slate-500">Belum diunggah</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doc && (
                    <a href={`${CITIZEN_API.requests}/${id}/dokumen/${doc.id}/unduh`} target="_blank" rel="noopener noreferrer"
                      className="clay-btn clay-btn-glass px-3 py-1.5 text-xs" aria-label={`Unduh ${d.label}`}>
                      <Download className="h-3.5 w-3.5" aria-hidden /> Lihat
                    </a>
                  )}
                  {editable && (
                    <>
                      <input ref={(el) => { inputs.current[d.code] = el; }} id={`file-${d.code}`} type="file" accept={ACCEPT} className="sr-only"
                        onChange={(e) => void upload(d.code, e.target.files?.[0])} />
                      <label htmlFor={`file-${d.code}`} className={`clay-btn clay-btn-sky px-3 py-1.5 text-xs ${busyCode === d.code ? "pointer-events-none opacity-60" : ""}`}>
                        <Upload className="h-3.5 w-3.5" aria-hidden />
                        {busyCode === d.code ? "Mengunggah…" : doc ? "Ganti" : "Pilih berkas"}
                      </label>
                      {doc && (
                        <button type="button" onClick={() => void removeDoc(doc.id, d.label)} className="rounded-full p-2 text-red-700 hover:bg-red-50" aria-label={`Hapus ${d.label}`}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {editable && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            {isDraft ? (
              <button type="button" onClick={() => void removeDraft()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline">
                <Trash2 className="h-4 w-4" aria-hidden /> Hapus draf
              </button>
            ) : <span />}
            <div className="flex items-center gap-3">
              {missing > 0 && <p className="text-xs text-orange-800" role="status">{missing} berkas wajib belum diunggah</p>}
              <button type="button" disabled={missing > 0 || sending} onClick={() => void send()} className="clay-btn clay-btn-sky px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" aria-hidden /> {sending ? "Mengirim…" : needsFix ? "Kirim Perbaikan" : "Kirim Permohonan"}
              </button>
            </div>
          </div>
        )}
      </section>

      {!isDraft && (
        <section className="clay-card space-y-4 p-6" aria-labelledby="progres-h">
          <h2 id="progres-h" className="text-lg text-slate-900">Progres permohonan</h2>
          <ol className="space-y-4 border-l-2 border-sky-200 pl-5">
            {req.timeline.map((t, i) => (
              <li key={`${t.status}-${i}`} className="relative">
                <span className="absolute -left-[1.7rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-600" aria-hidden />
                <p className="text-sm font-semibold text-slate-900">{statusLabel(t.status)}</p>
                {t.public_note && <p className="text-sm text-slate-600">{t.public_note}</p>}
                <p className="text-xs text-slate-500">{formatDateTimeId(t.changed_at)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default function PermohonanDetailPage() {
  return (
    <CitizenShell>
      <Detail />
    </CitizenShell>
  );
}
