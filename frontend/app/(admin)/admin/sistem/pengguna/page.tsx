"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { PaginatedResponse, RoleCode, UserProfile } from "@/types/global";
import { GlassCard } from "@/app/(admin)/_components/ui/GlassCard";
import { StatusBadge } from "@/app/(admin)/_components/ui/StatusBadge";
import { swallAlert } from "@/lib/show_swall";

export default function SistemPenggunaPage() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "operator_desa" as RoleCode,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["sistem-pengguna"],
    queryFn: () =>
      fetchData<PaginatedResponse<UserProfile>>(
        `${baseUrl}/api/v1/admin/sistem/pengguna/read`
      ),
  });

  const createMut = useMutation({
    mutationFn: () =>
      fetchData(`${baseUrl}/api/v1/admin/sistem/pengguna/create`, {
        method: "POST",
        body: form,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sistem-pengguna"] });
      swallAlert("Pengguna ditambahkan", "success");
      setOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Manajemen Pengguna &amp; Hak Akses</h1>
            <p className="text-xs opacity-75">
              Pengaturan akun petugas kecamatan dan operator desa/kelurahan berbasis RBAC.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Pengguna
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {isLoading ? (
          <div className="py-8 text-center text-xs opacity-70">Memuat pengguna...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 opacity-70">
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">Peran (Role)</th>
                  <th className="py-2.5 px-3">Wilayah Tugas</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-sky-400/10">
                    <td className="py-3 px-3 font-mono font-semibold">{u.username}</td>
                    <td className="py-3 px-3 font-semibold">{u.full_name}</td>
                    <td className="py-3 px-3">
                      <StatusBadge variant="kelurahan" label={u.role_label} />
                    </td>
                    <td className="py-3 px-3">
                      {u.village_name
                        ? `${u.village_name} (Kec. ${u.district_name})`
                        : u.district_name
                          ? `Kec. ${u.district_name}`
                          : "Lintas Kabupaten"}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge
                        variant={u.is_active ? "active" : "inactive"}
                        label={u.is_active ? "Aktif" : "Nonaktif"}
                      />
                    </td>
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
              <h2 className="text-base font-bold">Tambah Pengguna</h2>
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
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Username"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nama Lengkap"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email Dinas"
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as RoleCode })}
                className="admin-input w-full rounded-xl px-3 py-2 text-xs"
              >
                <option value="admin_kecamatan">Admin Kecamatan</option>
                <option value="camat_sekcam">Camat / Sekcam</option>
                <option value="kasi_pelayanan">Kasi / Petugas Layanan</option>
                <option value="operator_desa">Operator Desa/Kelurahan</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold admin-glass cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
