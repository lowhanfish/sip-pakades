"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Power, PowerOff, Save } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, OptionItem } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";

interface OfferingItem {
  service_type_id: string;
  code: string;
  name: string;
  description: string | null;
  category: "perizinan" | "nonperizinan" | "rekomendasi" | "legalisasi";
  requires_village_letter: boolean;
  sla_days: number;
  criteria_required: Array<{ key: string; label: string }>;
  is_active: boolean;
  legal_basis: string | null;
  legal_basis_reviewed_at: string | null;
  criteria_checks: Record<string, boolean>;
  not_village_function: boolean;
  notes: string | null;
  activated_at: string | null;
  problems: string[];
}

interface Draft {
  legal_basis: string;
  legal_basis_reviewed_at: string;
  not_village_function: boolean;
  criteria_checks: Record<string, boolean>;
  notes: string;
}

const CATEGORY_LABEL: Record<OfferingItem["category"], string> = {
  perizinan: "Perizinan",
  nonperizinan: "Nonperizinan",
  rekomendasi: "Rekomendasi",
  legalisasi: "Legalisasi",
};

function toDraft(o: OfferingItem): Draft {
  return {
    legal_basis: o.legal_basis ?? "",
    legal_basis_reviewed_at: o.legal_basis_reviewed_at ?? "",
    not_village_function: o.not_village_function,
    criteria_checks: { ...o.criteria_checks },
    notes: o.notes ?? "",
  };
}

export default function PengaturanLayananPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isSuper = user?.role === "superadmin_kab";
  const canActivate = user?.role === "camat_sekcam" || isSuper;

  const [districtId, setDistrictId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: districts } = useQuery({
    queryKey: ["master-kecamatan-option"],
    queryFn: () => fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/kecamatan/option`),
    enabled: isSuper,
  });

  const scopeReady = !isSuper || !!districtId;
  const qs = isSuper && districtId ? `?district_id=${encodeURIComponent(districtId)}` : "";

  const list = useQuery({
    queryKey: ["layanan-offerings", districtId],
    queryFn: () => fetchData<ApiEnvelope<OfferingItem[]>>(`${baseUrl}/api/v1/admin/pelayanan/layanan${qs}`),
    enabled: scopeReady,
  });
  const items = list.data?.data ?? [];
  const selected = items.find((i) => i.service_type_id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setDraft(toDraft(selected));
    else setDraft(null);
    // Muat ulang isian hanya saat layanan lain dipilih atau datanya berubah dari server.
  }, [selected?.service_type_id, selected?.activated_at, selected?.legal_basis, selected?.is_active]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyResult(res: ApiEnvelope<OfferingItem>) {
    qc.setQueryData<ApiEnvelope<OfferingItem[]>>(["layanan-offerings", districtId], (old) =>
      old ? { ...old, data: old.data.map((i) => (i.service_type_id === res.data.service_type_id ? res.data : i)) } : old
    );
  }

  const saveMut = useMutation({
    mutationFn: () =>
      fetchData<ApiEnvelope<OfferingItem>>(
        `${baseUrl}/api/v1/admin/pelayanan/layanan/${selectedId}${qs}`,
        {
          method: "PUT",
          body: {
            legal_basis: draft?.legal_basis,
            legal_basis_reviewed_at: draft?.legal_basis_reviewed_at || null,
            not_village_function: draft?.not_village_function,
            criteria_checks: draft?.criteria_checks,
            notes: draft?.notes,
          },
        }
      ),
    onSuccess: (res) => {
      applyResult(res);
      void swallAlert(
        selected?.is_active ? "Tersimpan. Layanan dinonaktifkan untuk ditinjau ulang." : "Pengaturan tersimpan",
        "success"
      );
    },
    onError: (err: Error) => swallAlert("Gagal menyimpan", "error", err.message),
  });

  const actMut = useMutation({
    mutationFn: (action: "activate" | "deactivate") =>
      fetchData<ApiEnvelope<OfferingItem>>(
        `${baseUrl}/api/v1/admin/pelayanan/layanan/${selectedId}/${action}${qs}`,
        { method: "POST" }
      ),
    onSuccess: (res) => {
      applyResult(res);
      void swallAlert(res.message, "success");
    },
    onError: (err: Error) => swallAlert("Tidak dapat diproses", "error", err.message),
  });

  // Kekurangan terbaru dihitung dari isian yang sedang diketik, tetapi aktivasi tetap diputuskan server.
  const unsaved =
    !!selected && !!draft && JSON.stringify(draft) !== JSON.stringify(toDraft(selected));

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="text-lg font-bold">Pengaturan Layanan Kecamatan</h1>
        <p className="mt-1 text-xs opacity-75">
          Layanan baru tayang ke warga setelah dasar hukumnya dicatat, kriteria pelimpahan terpenuhi, dan
          Camat mengaktifkannya (PP 17/2018 Pasal 11). Layanan yang menjadi fungsi desa/kelurahan tidak
          boleh dibuka di sini.
        </p>
        {isSuper && (
          <select
            value={districtId}
            onChange={(e) => { setDistrictId(e.target.value); setSelectedId(null); }}
            className="admin-input mt-3 rounded-xl px-3 py-2 text-xs"
            aria-label="Pilih kecamatan"
          >
            <option value="">-- Pilih Kecamatan --</option>
            {(districts ?? []).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        )}
      </GlassCard>

      {!scopeReady ? (
        <GlassCard><p className="py-6 text-center text-xs opacity-70">Pilih kecamatan terlebih dahulu.</p></GlassCard>
      ) : list.isLoading ? (
        <GlassCard><p className="py-6 text-center text-xs opacity-70">Memuat layanan…</p></GlassCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <GlassCard className="space-y-2 lg:col-span-2">
            <h2 className="text-sm font-bold">Daftar Layanan</h2>
            {items.map((o) => (
              <button
                key={o.service_type_id}
                type="button"
                onClick={() => setSelectedId(o.service_type_id)}
                aria-pressed={selectedId === o.service_type_id}
                className={`w-full cursor-pointer rounded-xl border p-3 text-left text-xs transition ${
                  selectedId === o.service_type_id ? "border-sky-500 bg-sky-500/10" : "border-sky-400/20 hover:bg-sky-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{o.name}</span>
                  <StatusBadge variant={o.is_active ? "active" : "inactive"} label={o.is_active ? "TAYANG" : "NONAKTIF"} />
                </div>
                <div className="mt-1 opacity-65">{CATEGORY_LABEL[o.category]} · {o.code}</div>
              </button>
            ))}
          </GlassCard>

          <GlassCard className="space-y-4 lg:col-span-3">
            {!selected || !draft ? (
              <p className="py-10 text-center text-xs opacity-70">Pilih layanan di sebelah kiri untuk mengatur.</p>
            ) : (
              <>
                <div>
                  <h2 className="text-base font-bold">{selected.name}</h2>
                  <p className="text-xs opacity-70">{selected.description}</p>
                  <p className="mt-1 text-[11px] opacity-60">
                    Kategori: {CATEGORY_LABEL[selected.category]} · Estimasi {selected.sla_days} hari ·{" "}
                    {selected.requires_village_letter ? "Wajib melampirkan surat desa/kelurahan" : "Tanpa surat desa"}
                  </p>
                </div>

                <label className="block text-xs">
                  <span className="mb-1 block font-semibold">Dasar hukum *</span>
                  <textarea
                    value={draft.legal_basis}
                    onChange={(e) => setDraft({ ...draft, legal_basis: e.target.value })}
                    rows={2}
                    placeholder="Contoh: Peraturan Bupati Konawe Selatan Nomor … Tahun …"
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-semibold">Tanggal terakhir dasar hukum ditinjau *</span>
                  <input
                    type="date"
                    value={draft.legal_basis_reviewed_at}
                    onChange={(e) => setDraft({ ...draft, legal_basis_reviewed_at: e.target.value })}
                    className="admin-input rounded-xl px-3 py-2 text-xs"
                  />
                </label>

                {selected.criteria_required.length > 0 && (
                  <fieldset className="space-y-1.5 text-xs">
                    <legend className="mb-1 font-semibold">
                      Kriteria pelimpahan ({CATEGORY_LABEL[selected.category]}), semua harus terpenuhi
                    </legend>
                    {selected.criteria_required.map((c) => (
                      <label key={c.key} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={!!draft.criteria_checks[c.key]}
                          onChange={(e) =>
                            setDraft({ ...draft, criteria_checks: { ...draft.criteria_checks, [c.key]: e.target.checked } })
                          }
                          className="mt-0.5"
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.not_village_function}
                    onChange={(e) => setDraft({ ...draft, not_village_function: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>Layanan ini <strong>bukan</strong> fungsi desa/kelurahan dan tidak beririsan dengan layanan mereka.</span>
                </label>

                <label className="block text-xs">
                  <span className="mb-1 block font-semibold">Catatan internal</span>
                  <input
                    type="text"
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    className="admin-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </label>

                {selected.problems.length > 0 && !unsaved && (
                  <div role="status" className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-xs">
                    <div className="mb-1 flex items-center gap-1.5 font-bold"><CircleAlert className="h-3.5 w-3.5" /> Belum dapat diaktifkan</div>
                    <ul className="list-disc space-y-0.5 pl-5">{selected.problems.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                )}
                {selected.problems.length === 0 && !unsaved && !selected.is_active && (
                  <p role="status" className="flex items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-emerald-400/10 p-3 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Persyaratan lengkap. Siap diaktifkan oleh Camat.
                  </p>
                )}
                {selected.is_active && (
                  <p className="text-[11px] opacity-70">
                    Layanan sedang tayang. Menyimpan perubahan akan menonaktifkannya sampai ditinjau dan diaktifkan lagi.
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-sky-400/20 pt-3">
                  <button type="button" disabled={saveMut.isPending || !unsaved} onClick={() => saveMut.mutate()}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    <Save className="h-3.5 w-3.5" /> {saveMut.isPending ? "Menyimpan…" : "Simpan"}
                  </button>
                  {selected.is_active ? (
                    <button type="button" disabled={actMut.isPending} onClick={() => actMut.mutate("deactivate")}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      <PowerOff className="h-3.5 w-3.5" /> Nonaktifkan
                    </button>
                  ) : canActivate ? (
                    <button type="button" disabled={actMut.isPending || unsaved || selected.problems.length > 0} onClick={() => actMut.mutate("activate")}
                      title={unsaved ? "Simpan perubahan terlebih dahulu" : undefined}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                      <Power className="h-3.5 w-3.5" /> Aktifkan untuk Warga
                    </button>
                  ) : (
                    <span className="self-center text-[11px] opacity-70">Hanya Camat yang dapat mengaktifkan layanan.</span>
                  )}
                </div>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
