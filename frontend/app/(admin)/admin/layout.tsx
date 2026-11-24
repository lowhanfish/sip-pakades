"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, ExternalLink, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import { getAdminMenusForRole } from "../_data/admin-menu";
import { AdminThemeToggle } from "../_components/admin-theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div
        data-admin-theme={theme}
        className="admin-shell min-h-screen flex items-center justify-center"
      >
        <div className="admin-glass rounded-2xl px-6 py-4 text-sm font-medium">
          Memeriksa sesi autentikasi...
        </div>
      </div>
    );
  }

  const navGroups = getAdminMenusForRole(user.role);

  return (
    <div
      data-admin-theme={theme}
      className="admin-shell min-h-screen flex"
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-68 p-4 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="admin-glass h-full rounded-3xl p-4 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-2rem)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2 pt-1">
              <Link href="/admin" className="flex items-center gap-3">
                <Image
                  src="/img/logo-konsel.webp"
                  alt="Logo Konsel"
                  width={36}
                  height={42}
                />
                <div>
                  <div className="text-sm font-bold tracking-tight">
                    SIP-PAKADES
                  </div>
                  <div className="text-[11px] opacity-70">
                    {user.district_name ? `Kec. ${user.district_name}` : "Kab. Konsel"}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-sky-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {navGroups.map((group) => {
                const hasActive = group.items.some((i) => pathname === i.href);
                const single = group.items.length === 1;
                const isOpen = openGroups[group.group] ?? hasActive;

                if (single) {
                  const item = group.items[0];
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.code}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition ${
                        active ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30" : "hover:bg-sky-500/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={group.group}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenGroups((p) => ({ ...p, [group.group]: !isOpen }))}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition cursor-pointer ${
                        hasActive ? "text-sky-600" : "hover:bg-sky-500/10"
                      }`}
                    >
                      <span className="capitalize">{group.group.toLowerCase()}</span>
                      <ChevronDown className={`w-4 h-4 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="ml-3 pl-3 border-l border-sky-400/25 py-1 space-y-0.5">
                          {group.items.map((item) => {
                            const active = pathname === item.href;
                            return (
                              <Link
                                key={item.code}
                                href={item.href}
                                tabIndex={isOpen ? 0 : -1}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                                  active ? "bg-sky-500 text-white font-semibold shadow-sm shadow-sky-500/30" : "opacity-80 hover:opacity-100 hover:bg-sky-500/10"
                                }`}
                              >
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-4 border-t border-sky-400/20">
            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium hover:bg-sky-500/10 transition"
            >
              <span>Portal Publik</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:pl-0 gap-4">
        <header className="admin-glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl admin-glass"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="text-xs font-semibold opacity-70">
                {user.role_label}
                {user.village_name ? ` • ${user.village_name}` : ""}
              </div>
              <div className="text-sm font-bold">{user.full_name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <AdminThemeToggle />
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
