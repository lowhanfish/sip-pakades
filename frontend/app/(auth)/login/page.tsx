"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KeyRound, LogIn, ArrowLeft } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, AuthSessionData } from "@/types/global";
import { swallAlert } from "@/lib/show_swall";

const QUICK_ACCOUNTS = [
  { username: "superadmin", label: "Superadmin Kab." },
  { username: "admin_laeya", label: "Admin Kec. Laeya" },
  { username: "camat_laeya", label: "Camat Laeya (Ansar)" },
  { username: "kasi_laeya", label: "Kasi Pelayanan" },
  { username: "op_torobulu", label: "Op. Desa Torobulu" },
  { username: "op_puunggaluku", label: "Op. Kel. Puunggaluku" },
];

export default function LoginPage() {
  const router = useRouter();
  const loginUrl = useUrlStore((s) => s.URL.LOGIN);
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchData<ApiEnvelope<AuthSessionData>>(
        loginUrl,
        {
          method: "POST",
          body: { username, password },
        },
        false
      );
      if (res.success && res.data?.user) {
        setSession(res.data.user, res.data.menus ?? []);
        await swallAlert(`Selamat datang, ${res.data.user.full_name}`, "success");
        router.push("/admin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal login";
      await swallAlert("Login Gagal", "error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Beranda Publik
          </Link>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-yellow-200/80 text-slate-800">
            Mode Simulasi RBAC
          </span>
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <Image
            src="/img/logo-konsel.webp"
            alt="Logo Kab. Konawe Selatan"
            width={64}
            height={74}
          />
          <h1 className="text-xl font-bold text-slate-900">
            Masuk SIP-PAKADES
          </h1>
          <p className="text-xs text-slate-600">
            Portal Administrasi Kecamatan & Desa Kab. Konawe Selatan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-sky-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-sky-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Masukkan kata sandi"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 text-sm shadow-md shadow-sky-500/20 transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="pt-3 border-t border-sky-200/60 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <KeyRound className="w-3.5 h-3.5 text-sky-600" />
            Isi Cepat Akun Uji RBAC:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => {
                  setUsername(acc.username);
                  setPassword("demo1234");
                }}
                className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                  username === acc.username
                    ? "bg-sky-100 border-sky-400 text-sky-900 font-semibold"
                    : "bg-white/60 border-sky-200/70 text-slate-700 hover:bg-sky-50"
                }`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
