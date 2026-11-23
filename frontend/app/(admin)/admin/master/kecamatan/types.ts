import { DistrictItem, PaginatedResponse, ApiEnvelope } from "@/types/global";

export type KecamatanItem = DistrictItem;
export type KecamatanListResponse = PaginatedResponse<KecamatanItem>;
export type KecamatanDetailResponse = ApiEnvelope<KecamatanItem>;

export interface KecamatanFormInput {
  code: string;
  name: string;
  slug: string;
  office_address: string;
  phone: string;
  email: string;
  service_hours: string;
  vision: string;
  mission: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_default: boolean;
}
