"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse } from "@/types/global";
import { PublicAnnouncementItem } from "@/lib/mock/seed-publish";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { formatDateId } from "@/utilities/pagination";

const PRESET_THUMBNAILS = [
  { label: "Rapat & Koordinasi (3D)", url: "/img/berita-rakor.webp" },
  { label: "Layanan SIP-PAKADES (3D)", url: "/img/berita-layanan.webp" },
  { label: "Musrenbang Desa (3D)", url: "/img/berita-musrenbang.webp" },
  { label: "Kantor Kecamatan (3D)", url: "/img/gedung-kecamatan.webp" },
];

export default function PublikasiBeritaPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"berita" | "pengumuman" | "agenda">("berita");
  const [thumbnailUrl, setThumbnailUrl] = useState("/img/berita-rakor.webp");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["publikasi-berita"],
    queryFn: () =>
      fetchData<PaginatedResponse<PublicAnnouncementItem>>(
        `${baseUrl}/api/v1/admin/publikasi/berita/read`
      ),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      category: string;
      thumbnail_url: string;
      excerpt: string;
      content: string;
    }) =>
      fetchData(`${baseUrl}/api/v1/admin/publikasi/berita/create`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publikasi-berita"] });
      queryClient.invalidateQueries({ queryKey: ["publish-announcements"] });
      setShowModal(false);
      setTitle("");
      setExcerpt("");
      setContent("");
      Swal.fire("Berhasil", "Berita berhasil diterbitkan ke halaman publik.", "success");
    },
    onError: (err: Error) => {
      Swal.fire("Gagal", err.message || "Gagal menerbitkan berita.", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchData(`${baseUrl}/api/v1/admin/publikasi/berita/delete/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publikasi-berita"] });
      queryClient.invalidateQueries({ queryKey: ["publish-announcements"] });
      Swal.fire("Terhapus", "Berita berhasil dihapus.", "success");
    },
    onError: (err: Error) => {
      Swal.fire("Gagal", err.message || "Gagal menghapus berita.", "error");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({
      title,
      category,
      thumbnail_url: thumbnailUrl,
      excerpt: excerpt || content.slice(0, 140),
      content,
    });
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Berita &amp; Pengumuman Pemerintahan</h1>
            <p className="text-xs opacity-75">
              Publikasi berita kegiatan dan pengumuman resmi yang tampil langsung di Landing Page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="clay-btn clay-btn-sky px-4 py-2 text-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Berita
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat berita...</div>
        ) : (
          <div className="space-y-3">
            {(data?.data ?? []).map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-sky-400/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/60 bg-sky-100">
                    <Image
                      src={a.thumbnail_url || "/img/berita-rakor.webp"}
                      alt={a.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge variant="kelurahan" label={a.category.toUpperCase()} />
                      <span className="text-[11px] opacity-65">
                        {formatDateId(a.published_at)}
                      </span>
                    </div>
                    <div className="text-sm font-bold">{a.title}</div>
                    <p className="text-xs opacity-75 line-clamp-2">{a.excerpt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <StatusBadge variant="active" label="Terbit" />
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(a.id)}
                    className="p-2 rounded-xl hover:bg-rose-500/15 text-rose-500 transition cursor-pointer"
                    title="Hapus berita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="admin-glass rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Tambah Berita / Pengumuman</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-sky-500/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Judul</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Kegiatan Gotong Royong Desa Torobulu"
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "berita" | "pengumuman" | "agenda")}
                    className="admin-input w-full px-3 py-2"
                  >
                    <option value="berita">Berita</option>
                    <option value="pengumuman">Pengumuman</option>
                    <option value="agenda">Agenda</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Gambar Ilustrasi</label>
                  <select
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="admin-input w-full px-3 py-2"
                  >
                    {PRESET_THUMBNAILS.map((p) => (
                      <option key={p.url} value={p.url}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Ringkasan Singkat</label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan 1-2 kalimat..."
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Isi Lengkap</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis isi berita atau pengumuman..."
                  className="admin-input w-full px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-sky-400/30 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="clay-btn clay-btn-sky px-5 py-2"
                >
                  {createMutation.isPending ? "Menyimpan..." : "Terbitkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
