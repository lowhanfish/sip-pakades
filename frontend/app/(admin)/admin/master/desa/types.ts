import {
  ApiEnvelope,
  PaginatedResponse,
  VillageBoundaries,
  VillageItem,
  VillageType,
} from "@/types/global";

export type DesaItem = VillageItem;
export type DesaListResponse = PaginatedResponse<DesaItem>;
export type DesaDetailResponse = ApiEnvelope<DesaItem>;

export interface DesaFormInput {
  district_id: string;
  code: string;
  name: string;
  slug: string;
  type: VillageType;
  description: string;
  history: string;
  boundaries: VillageBoundaries;
  area_km2: number | null;
  dusun_count: number;
  rw_count: number;
  rt_count: number;
  population_total: number;
  household_total: number;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}
