"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { IncomingLetterItem } from "@/lib/mock/seed-admin";
import { PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";

export default function SuratMasukPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [dispTarget, setDispTarget] = useState<IncomingLetterItem | null>(null);
  const [instruction, setInstruction] = useState("");
  const [form, setForm] = useState({
    origin_letter_number: "",
    origin_sender: "",
    subject: "",
    urgency: "biasa",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["persuratan-masuk"],
    queryFn: () =>
      fetchData<PaginatedResponse<IncomingLetterItem>>(
        `${baseUrl}/api/v1/admin/persuratan/surat-masuk/read`
      ),
  });

  const createMut = useMutation({
    mutationFn: () =>
      fetchData(`${baseUrl}/api/v1/admin/persuratan/surat-masuk/create`, {
        method: "POST",
        body: form,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["persuratan-masuk"] });
      swallAlert("Surat masuk dicatat", "success");
      setOpenCreate(false);
    },
  });

  const dispMut = useMutation({
    mutationFn: () =>
      fetchData(
        `${baseUrl}/api/v1/admin/persuratan/surat-masuk/${dispTarget?.id}/dispositions`,
        {
          method: "POST",
          body: { instruction, target_user_name: "Kasi Pelayanan" },
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["persuratan-masuk"] });
      swallAlert("Disposisi terkirim", "success");
      setDispTarget(null);
      setInstruction("");
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Surat Masuk &amp; Disposisi Camat</h1>
            <p className="text-xs opacity-75">
              Pencatatan surat masuk dari desa/OPD dan lembar disposisi ke Kasi terkait.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Catat Surat Masuk
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat surat masuk...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Agenda / No. Asal</th>
                  <th className="py-2.5 px-3">Pengirim</th>
                  <th className="py-2.5 px-3">Perihal</th>
                  <th className="py-2.5 px-3">Status Disposisi</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold">{item.agenda_number}</div>
                      <div className="text-[11px] opacity-65">{item.origin_letter_number}</div>
                    </td>
                    <td className="py-3 px-3">{item.origin_sender}</td>
                    <td className="py-3 px-3 font-semibold">{item.subject}</td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={item.disposition_status === "selesai" ? "selesai" : "diajukan"}
                        label={item.disposition_status.toUpperCase()}
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDispTarget(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-300/90 text-slate-900 font-semibold text-[11px] cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Disposisi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Catat Surat Masuk</h2>
              <button type="button" onClick={() => setOpenCreate(false)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                await createMut.mutateAsync();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                value={form.origin_letter_number}
                onChange={(e) => setForm({ ...form, origin_letter_number: e.target.value })}
                placeholder="Nomor Surat Asal"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                value={form.origin_sender}
                onChange={(e) => setForm({ ...form, origin_sender: e.target.value })}
                placeholder="Pengirim (Desa / Instansi)"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Perihal Surat"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dispTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Disposisi Camat / Sekcam</h2>
              <button type="button" onClick={() => setDispTarget(null)} className="p-1.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs opacity-75">{dispTarget.subject}</div>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Instruksi disposisi kepada Kasi terkait..."
              className="admin-input w-full rounded-xl p-3 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDispTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
              <button type="button" onClick={() => dispMut.mutate()} className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Kirim Disposisi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
