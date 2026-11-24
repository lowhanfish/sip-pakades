import { create } from "zustand";
import { ApiEnvelope } from "@/types/global";
import { CitizenProfile, CitizenSessionData } from "@/types/citizen";
import { CITIZEN_API, citizenFetch } from "@/lib/api_citizen";

type Status = "loading" | "authenticated" | "anonymous";

interface CitizenState {
  citizen: CitizenProfile | null;
  status: Status;
  setCitizen: (c: CitizenProfile | null) => void;
  load: () => Promise<CitizenProfile | null>;
  logout: () => Promise<void>;
}

export const useCitizenStore = create<CitizenState>((set) => ({
  citizen: null,
  status: "loading",

  setCitizen: (citizen) => set({ citizen, status: citizen ? "authenticated" : "anonymous" }),

  load: async () => {
    try {
      const res = await citizenFetch<ApiEnvelope<CitizenSessionData>>(CITIZEN_API.me);
      set({ citizen: res.data.citizen, status: "authenticated" });
      return res.data.citizen;
    } catch {
      set({ citizen: null, status: "anonymous" });
      return null;
    }
  },

  logout: async () => {
    try {
      await citizenFetch(CITIZEN_API.logout, { method: "POST", noRefresh: true });
    } catch {
      // sesi lokal tetap dibersihkan
    }
    set({ citizen: null, status: "anonymous" });
  },
}));
