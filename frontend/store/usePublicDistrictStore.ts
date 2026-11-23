import { create } from "zustand";

interface PublicDistrictState {
  selectedSlug: string;
  setSelectedSlug: (slug: string) => void;
}

export const usePublicDistrictStore = create<PublicDistrictState>((set) => ({
  selectedSlug: "laeya",
  setSelectedSlug: (selectedSlug) => set({ selectedSlug }),
}));
