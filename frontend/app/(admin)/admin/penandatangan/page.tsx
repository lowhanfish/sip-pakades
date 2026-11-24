"use client";

import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Eye, KeyRound, PenLine, ShieldAlert, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { ApiEnvelope } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { swallAlert } from "@/lib/show_swall";
import { formatDateTimeId } from "@/utilities/pagination";

interface SignerStatus {
  tte: { mode: string; ready: boolean };
  signer: { full_name: string; nip: string | null; has_nik: boolean; nik_masked: string | null };
}

interface QueueItem {
  id: string;
  registration_number: string;
  applicant_name: string;
  service_type_name: string;
  village_name: string;
  verified_at: string | null;
  last_attempt: { id: string; status: string; message: string | null; at: string } | null;
}

interface SignResult {
  request_id: string;
  status: "succeeded" | "failed" | "unknown" | "skipped";
  message: string;
  registration_number?: string;
  letter_number?: string;
  transaction_id?: string;
}

const RESULT_STYLE: Record<SignResult["status"], string> = {
  succeeded: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-red-500/10 text-red-700",
  unknown: "bg-amber-500/15 text-amber-800",
  skipped: "bg-slate-500/10 text-slate-600",
};
const RESULT_LABEL: Record<SignResult["status"], string> = {
  succeeded: "Berhasil",
  failed: "Gagal",
  unknown: "Belum pasti",
  skipped: "Dilewati",
};

export default function PenandatanganPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const api = `${baseUrl}/api/v1/admin/penandatangan`;

  const [selected, setSelected] = useState<string[]>([]);
  const [nik, setNik] = useState("");
  const [editingNik, setEditingNik] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [results, setResults] = useState<SignResult[] | null>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const status = useQuery({
    queryKey: ["signer-status"],
    queryFn: () => fetchData<ApiEnvelope<SignerStatus>>(`${api}/status`),
  });
  const queue = useQuery({
    queryKey: ["signer-queue"],
    queryFn: () => fetchData<ApiEnvelope<QueueItem[]>>(`${api}/antrean`),
  });
  const items = queue.data?.data ?? [];
  const signer = status.data?.data.signer;
  const tte = status.data?.data.tte;
  const canSign = !!tte?.ready && !!signer?.has_nik;

  const nikMut = useMutation({
    mutationFn: () => fetchData<ApiEnvelope<{ nik_masked: string }>>(`${api}/nik`, { method: "PUT", body: { nik } }),
    onSuccess: () => {
      setNik("");
      setEditingNik(false);
      void qc.invalidateQueries({ queryKey: ["signer-status"] });
      void swallAlert("NIK penandatangan tersimpan", "success");
    },
    onError: (e: Error) => swallAlert("Gagal menyimpan NIK", "error", e.message),
  });

  const signMut = useMutation({
    mutationFn: (passphrase: string) =>
      fetchData<ApiEnvelope<SignResult[]>>(`${api}/tandatangani`, {
        method: "POST",
        body: { request_ids: selected, passphrase },
      }),
    onSuccess: (res) => {
      setResults(res.data);
      setSelected([]);
      void qc.invalidateQueries({ queryKey: ["signer-queue"] });
      void qc.invalidateQueries({ queryKey: ["pelayanan-permohonan"] });
    },
    onError: (e: Error) => swallAlert("Penandatanganan gagal", "error", e.message),
    // Passphrase tidak boleh tertinggal di layar atau memori formulir.
    onSettled: () => {
      if (passRef.current) passRef.current.value = "";
    },
  });

  const checkMut = useMutation({
    mutationFn: (txId: string) =>
      fetchData<ApiEnvelope<{ status: string; message: string }>>(`${api}/transaksi/${txId}/periksa`, { method: "POST" }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["signer-queue"] });
      void swallAlert(res.data.message, res.data.status === "succeeded" ? "success" : "info");
    },
    onError: (e: Error) => swallAlert("Gagal memeriksa", "error", e.message),
  });

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function submitSign(e: FormEvent) {
    e.preventDefault();
    const value = passRef.current?.value ?? "";
    if (!value) return;
    setResults(null);
    signMut.mutate(value);
  }

  function closeSign() {
    if (passRef.current) passRef.current.value = "";
    setSignOpen(false);
    setResults(null);
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Penandatanganan Surat (TTE)</h1>
        <p className="mt-1 text-xs opacity-75">
          Surat yang sudah diverifikasi Admin Kecamatan menunggu tanda tangan Anda di sini. Cukup masukkan
          passphrase sekali untuk beberapa surat. Passphrase tidak pernah disimpan oleh aplikasi.
        </p>
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-bold"><KeyRound className="h-4 w-4" /> Identitas Penandatangan</h2>
        {tte && !tte.ready && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-xs">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Penandatanganan elektronik belum aktif di server (mode: <strong>{tte.mode}</strong>). Minta pengelola
              mengisi konfigurasi TTE di backend.
            </span>
          </p>
        )}
        {tte?.mode === "mock" && (
          <p role="note" className="rounded-xl border border-sky-400/40 bg-sky-400/10 p-3 text-xs">
            Mode <strong>simulasi</strong>: tanda tangan yang dihasilkan hanya untuk uji coba dan tidak sah.
          </p>
        )}
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div><span className="opacity-65">Nama:</span> <strong>{signer?.full_name ?? "-"}</strong></div>
          <div><span className="opacity-65">NIP:</span> <strong>{signer?.nip ?? "-"}</strong></div>
          <div className="sm:col-span-2">
            <span className="opacity-65">NIK untuk TTE:</span>{" "}
            <strong>{signer?.has_nik ? signer.nik_masked : "Belum diisi"}</strong>
          </div>
        </div>
        {editingNik || !signer?.has_nik ? (
          <form
            onSubmit={(e) => { e.preventDefault(); nikMut.mutate(); }}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="text-xs">
              <span className="mb-1 block font-semibold">NIK (16 digit)</span>
              <input
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                autoComplete="off"
                className="admin-input w-56 rounded-xl px-3 py-2 font-mono text-xs"
              />
            </label>
            <button type="submit" disabled={nik.length !== 16 || nikMut.isPending}
              className="cursor-pointer rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {nikMut.isPending ? "Menyimpan…" : "Simpan NIK"}
            </button>
            {signer?.has_nik && (
              <button type="button" onClick={() => { setEditingNik(false); setNik(""); }}
                className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold admin-glass">Batal</button>
            )}
            <p className="w-full text-[11px] opacity-65">Disimpan terenkripsi. Ini bukan passphrase; passphrase diminta setiap kali menandatangani.</p>
          </form>
        ) : (
          <button type="button" onClick={() => setEditingNik(true)} className="cursor-pointer text-xs font-semibold text-sky-600 hover:underline">
            Ganti NIK
          </button>
        )}
      </GlassCard>

      <GlassCard className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Menunggu Tanda Tangan ({items.length})</h2>
          <button type="button" disabled={!canSign || selected.length === 0}
            onClick={() => { setResults(null); setSignOpen(true); }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <PenLine className="h-3.5 w-3.5" /> Tandatangani {selected.length > 0 ? `${selected.length} Surat` : ""}
          </button>
        </div>
        {!canSign && <p className="text-[11px] opacity-70">Tombol aktif setelah NIK diisi dan TTE aktif di server.</p>}

        {queue.isLoading ? (
          <p className="py-8 text-center text-xs opacity-70">Memuat antrean…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-xs opacity-70">Tidak ada surat yang menunggu tanda tangan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="w-8 px-3 py-2.5">
                    <input type="checkbox" aria-label="Pilih semua"
                      checked={selected.length === items.length}
                      onChange={(e) => setSelected(e.target.checked ? items.map((i) => i.id) : [])} />
                  </th>
                  <th className="px-3 py-2.5">No. Registrasi</th>
                  <th className="px-3 py-2.5">Pemohon</th>
                  <th className="px-3 py-2.5">Layanan</th>
                  <th className="px-3 py-2.5">Diverifikasi</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-sky-400/10 align-top">
                    <td className="px-3 py-3">
                      <input type="checkbox" aria-label={`Pilih ${i.registration_number}`}
                        checked={selected.includes(i.id)} onChange={() => toggle(i.id)} />
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-sky-600">{i.registration_number}</td>
                    <td className="px-3 py-3"><div className="font-semibold">{i.applicant_name}</div><div className="opacity-65">{i.village_name}</div></td>
                    <td className="px-3 py-3">{i.service_type_name}</td>
                    <td className="px-3 py-3">{formatDateTimeId(i.verified_at)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <a href={`${api}/${i.id}/pratinjau`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold admin-glass">
                          <Eye className="h-3.5 w-3.5" /> Pratinjau
                        </a>
                        {i.last_attempt && (
                          <div className="max-w-56 text-[11px] text-amber-700">
                            <CircleAlert className="mr-1 inline h-3 w-3" />
                            {i.last_attempt.status === "unknown" ? "Hasil belum pasti. " : "Percobaan sebelumnya gagal. "}
                            {i.last_attempt.message}
                            {i.last_attempt.status === "unknown" && (
                              <button type="button" disabled={checkMut.isPending}
                                onClick={() => checkMut.mutate(i.last_attempt!.id)}
                                className="ml-1 cursor-pointer font-semibold underline">Periksa status</button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {signOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="sign-h">
          <div className="admin-glass max-h-[88vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 id="sign-h" className="text-base font-bold">Tandatangani {results ? "— Hasil" : `${selected.length} surat`}</h2>
              <button type="button" onClick={closeSign} aria-label="Tutup" className="cursor-pointer p-1.5"><X className="h-4 w-4" /></button>
            </div>

            {!results ? (
              <form onSubmit={submitSign} className="space-y-3">
                <p className="text-xs opacity-75">
                  Masukkan passphrase TTE Anda. Passphrase dikirim langsung ke server TTE dan tidak disimpan.
                  Bila passphrase salah, proses dihentikan agar akun TTE Anda tidak terkunci.
                </p>
                <label className="block text-xs">
                  <span className="mb-1 block font-semibold">Passphrase</span>
                  <input ref={passRef} type="password" autoComplete="off" autoFocus required maxLength={256}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeSign} className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold admin-glass">Batal</button>
                  <button type="submit" disabled={signMut.isPending}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60">
                    <PenLine className="h-3.5 w-3.5" /> {signMut.isPending ? "Menandatangani…" : "Tandatangani"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <ul className="space-y-2">
                  {results.map((r) => (
                    <li key={r.request_id} className={`rounded-xl p-3 text-xs ${RESULT_STYLE[r.status]}`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        {r.status === "succeeded" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {RESULT_LABEL[r.status]} · {r.registration_number ?? ""}
                      </div>
                      <div>{r.message}</div>
                      {r.letter_number && <div className="mt-0.5 font-mono">{r.letter_number}</div>}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end">
                  <button type="button" onClick={closeSign} className="cursor-pointer rounded-xl bg-sky-500 px-5 py-2 text-xs font-semibold text-white">Selesai</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
