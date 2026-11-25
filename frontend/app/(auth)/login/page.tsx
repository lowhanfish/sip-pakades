"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogIn, ArrowLeft } from "lucide-react";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiEnvelope, AuthSessionData } from "@/types/global";
import { swallAlert } from "@/lib/show_swall";

export default function LoginPage() {
  const router = useRouter();
  const loginUrl = useUrlStore((s) => s.URL.LOGIN);
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        router.replace("/admin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal login";
      await swallAlert("Login Gagal", "error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-shell min-h-screen grid lg:grid-cols-2">
      {/* Panel foto */}
      <aside className="hero-band hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <Link href="/" className="relative z-10 inline-flex items-center gap-3 text-sky-800 hover:text-sky-950 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="photo-print -rotate-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image src="/img/wisata-torobulu.webp" alt="Pesisir Torobulu, Konawe Selatan" fill sizes="480px" className="object-cover" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl leading-tight text-sky-950">Satu pintu untuk layanan kecamatan dan desa.</h2>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Kelola persuratan, pelayanan, dan pelaporan triwulan Kecamatan &amp; Desa Kab. Konawe Selatan.
            </p>
          </div>
        </div>
        <div className="relative z-10 text-xs text-slate-500">SIP-PAKADES · Pemerintah Kabupaten Konawe Selatan</div>
      </aside>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-sky-700">
            <ArrowLeft className="w-3.5 h-3.5" />
            Beranda Publik
          </Link>

          <div className="flex items-center gap-4">
            <Image src="/img/logo-konsel.webp" alt="Logo Kab. Konawe Selatan" width={48} height={56} />
            <div>
              <h1 className="text-2xl text-slate-900">Masuk SIP-PAKADES</h1>
              <p className="text-sm text-slate-500">Portal Administrasi Kecamatan &amp; Desa</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="clay-card card-accent p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="clay-input w-full px-3.5 py-2.5 text-sm text-slate-900"
                placeholder="Masukkan username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="clay-input w-full px-3.5 py-2.5 text-sm text-slate-900"
                placeholder="Masukkan kata sandi"
              />
            </div>
            <button type="submit" disabled={loading} className="clay-btn clay-btn-sky w-full disabled:opacity-60 py-3 text-sm">
              <LogIn className="w-4 h-4" />
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
