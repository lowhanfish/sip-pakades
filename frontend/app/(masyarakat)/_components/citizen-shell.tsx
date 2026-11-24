"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutGrid, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useCitizenStore } from "@/store/useCitizenStore";

const TABS = [
  { href: "/masyarakat/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/masyarakat/profil", label: "Profil Saya", icon: UserRound },
  { href: "/masyarakat/keamanan", label: "Keamanan", icon: ShieldCheck },
];

/** Membungkus halaman warga: memastikan sudah masuk, lalu menampilkan navigasi akun. */
export function CitizenShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useCitizenStore((s) => s.status);
  const load = useCitizenStore((s) => s.load);
  const logout = useCitizenStore((s) => s.logout);

  useEffect(() => {
    if (status === "loading") void load();
  }, [status, load]);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/masyarakat/masuk?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="container-page py-24 text-center text-sm text-slate-600" role="status">
        Memeriksa sesi Anda…
      </div>
    );
  }

  return (
    <div className="container-page space-y-6 pb-10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Menu akun warga" className="clay-card flex flex-wrap gap-1 p-1.5">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-sky-600 text-white shadow-md shadow-sky-600/30" : "text-slate-700 hover:bg-white/80"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/masyarakat/masuk");
          }}
          className="clay-btn clay-btn-glass px-4 py-2 text-sm text-red-700"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Keluar
        </button>
      </div>
      {children}
    </div>
  );
}
