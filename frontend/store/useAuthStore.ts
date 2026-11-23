import { create } from "zustand";
import { ApiEnvelope, AuthSessionData, MenuItem, UserProfile } from "@/types/global";
import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";

interface AuthState {
  user: UserProfile | null;
  menus: MenuItem[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (user: UserProfile | null, menus?: MenuItem[]) => void;
  checkAuth: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  menus: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setSession: (user, menus = []) =>
    set({
      user,
      menus,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const meUrl = useUrlStore.getState().URL.ME;
      const res = await fetchData<ApiEnvelope<AuthSessionData>>(meUrl, {}, false);
      if (res.success && res.data?.user) {
        set({
          user: res.data.user,
          menus: res.data.menus ?? [],
          isAuthenticated: true,
          isLoading: false,
        });
        return res.data.user;
      }
      set({ user: null, menus: [], isAuthenticated: false, isLoading: false });
      return null;
    } catch {
      set({ user: null, menus: [], isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      const logoutUrl = useUrlStore.getState().URL.LOGOUT;
      await fetchData(logoutUrl, { method: "POST" });
    } catch {
      // Tetap lanjutkan pembersihan sesi lokal
    } finally {
      set({ user: null, menus: [], isAuthenticated: false, isLoading: false });
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  },
}));
