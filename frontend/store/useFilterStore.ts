import { create } from "zustand";

interface FilterState {
  districtId: string;
  villageId: string;
  periodYear: number;
  periodQuarter: number | null;
  status: string;
  setDistrictId: (districtId: string) => void;
  setVillageId: (villageId: string) => void;
  setPeriodYear: (year: number) => void;
  setPeriodQuarter: (quarter: number | null) => void;
  setStatus: (status: string) => void;
  resetFilters: () => void;
}

const currentYear = new Date().getFullYear();

export const useFilterStore = create<FilterState>((set) => ({
  districtId: "",
  villageId: "",
  periodYear: currentYear,
  periodQuarter: null,
  status: "",
  setDistrictId: (districtId) => set({ districtId, villageId: "" }),
  setVillageId: (villageId) => set({ villageId }),
  setPeriodYear: (periodYear) => set({ periodYear }),
  setPeriodQuarter: (periodQuarter) => set({ periodQuarter }),
  setStatus: (status) => set({ status }),
  resetFilters: () =>
    set({
      districtId: "",
      villageId: "",
      periodYear: currentYear,
      periodQuarter: null,
      status: "",
    }),
}));
