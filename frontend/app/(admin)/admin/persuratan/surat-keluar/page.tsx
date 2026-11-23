"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { OutgoingLetterItem } from "@/lib/mock/seed-admin";
import { PaginatedResponse } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";

export default function SuratKeluarPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    classification_code: "140",
    letter_type: "rekomendasi",
    recipient: "",
    subject: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["persuratan-keluar"],
    queryFn: () =>
      fetchData<PaginatedResponse<OutgoingLetterItem>>(
        `${baseUrl}/api/v1/admin/persuratan/surat-keluar/read`
      ),
  });

  const createMut = useMutation({
    mutationFn: () =>
      fetchData(`${baseUrl}/api/v1/admin/persuratan/surat-keluar/create`, {
        method: "POST",
        body: form,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["persuratan-keluar"] });
      swallAlert("Surat keluar bernomor otomatis dicatat", "success");
      setOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Surat Keluar &amp; Penomoran Otomatis</h1>
            <p className="text-xs opacity-75">
              Registrasi surat pengantar, rekomendasi, keterangan, dan tugas kecamatan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Surat Keluar
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat surat keluar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Nomor Surat</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Tujuan</th>
                  <th className="py-2.5 px-3">Perihal</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3 font-mono font-bold text-sky-600">
                      {item.letter_number}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge variant="kelurahan" label={item.letter_type.toUpperCase()} />
                    </td>
                    <td className="py-3 px-3">{item.recipient}</td>
                    <td className="py-3 px-3 font-semibold">{item.subject}</td>
                    <td className="py-3 px-3">{item.letter_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Registrasi Surat Keluar</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 cursor-pointer">
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
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.classification_code}
                  onChange={(e) => setForm({ ...form, classification_code: e.target.value })}
                  className="admin-input rounded-xl px-3 py-2 text-xs"
                >
                  <option value="140">140 - Pemdes</option>
                  <option value="400">400 - Kesra</option>
                  <option value="500">500 - Perekonomian</option>
                  <option value="800">800 - Kepegawaian</option>
                </select>
                <select
                  value={form.letter_type}
                  onChange={(e) => setForm({ ...form, letter_type: e.target.value })}
                  className="admin-input rounded-xl px-3 py-2 text-xs"
                >
                  <option value="rekomendasi">Rekomendasi</option>
                  <option value="pengantar">Pengantar</option>
                  <option value="keterangan">Keterangan</option>
                  <option value="tugas">Surat Tugas</option>
                  <option value="undangan">Undangan</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="Tujuan / Penerima Surat"
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
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Terbitkan Nomor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
