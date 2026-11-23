"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPublic } from "@/lib/api";
import { useUrlStore } from "@/store/useUrlStore";
import {
  ApiEnvelope,
  DistrictItem,
  PaginatedResponse,
  VillageItem,
} from "@/types/global";
import {
  PublicAnnouncementItem,
  PublicLeader,
  PublicOrgNode,
  PublicPotentialItem,
  PublicRegulationItem,
  PublicServiceTrackResponse,
  PublicServiceTypeItem,
  PublicTourismItem,
} from "@/lib/mock/seed-publish";

export interface PublicOverviewResponse {
  district: DistrictItem;
  logo_url: string;
  leader: PublicLeader;
  org_structure: PublicOrgNode[];
  stats: {
    total_villages: number;
    total_officials: number;
    total_potentials: number;
    total_tourism: number;
    total_services_completed: number;
  };
}

export interface PublicVillageDetailResponse {
  village: VillageItem;
  officials: Array<{ position_name: string; full_name: string; phone?: string }>;
  potentials: PublicPotentialItem[];
  tourism: PublicTourismItem[];
}

export interface PublicPotentialsResponse {
  items: PublicPotentialItem[];
  total: number;
  chart_summary: Array<{
    category_name: string;
    count: number;
    total_value: number;
    unit: string;
  }>;
}

export function usePublicDistricts() {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-districts"],
    queryFn: () =>
      fetchPublic<ApiEnvelope<DistrictItem[]>>(
        `${baseUrl}/api/v1/publish/districts?active_only=true`
      ),
  });
}

export function usePublicOverview(slug: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-overview", slug],
    queryFn: () =>
      fetchPublic<ApiEnvelope<PublicOverviewResponse>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/overview`
      ),
    enabled: !!slug,
  });
}

export function usePublicVillages(
  slug: string,
  search = "",
  type = "",
  limit = 50
) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-villages", slug, search, type, limit],
    queryFn: () => {
      const q = new URLSearchParams({ limit: String(limit) });
      if (search) q.set("search", search);
      if (type) q.set("type", type);
      return fetchPublic<PaginatedResponse<VillageItem>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/villages?${q.toString()}`
      );
    },
    enabled: !!slug,
  });
}

export function usePublicVillageDetail(slug: string, villageId: string | null) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-village-detail", slug, villageId],
    queryFn: () =>
      fetchPublic<ApiEnvelope<PublicVillageDetailResponse>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/villages/${villageId}`
      ),
    enabled: !!slug && !!villageId,
  });
}

export function usePublicPotentials(slug: string, search = "", categoryId = "") {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-potentials", slug, search, categoryId],
    queryFn: () => {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (categoryId) q.set("category_id", categoryId);
      return fetchPublic<ApiEnvelope<PublicPotentialsResponse>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/potentials?${q.toString()}`
      );
    },
    enabled: !!slug,
  });
}

export function usePublicTourism(slug: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-tourism", slug],
    queryFn: () =>
      fetchPublic<PaginatedResponse<PublicTourismItem>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/tourism`
      ),
    enabled: !!slug,
  });
}

export function usePublicAnnouncements(slug: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-announcements", slug],
    queryFn: () =>
      fetchPublic<PaginatedResponse<PublicAnnouncementItem>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/announcements`
      ),
    enabled: !!slug,
  });
}

export function usePublicRegulations(slug: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-regulations", slug],
    queryFn: () =>
      fetchPublic<PaginatedResponse<PublicRegulationItem>>(
        `${baseUrl}/api/v1/publish/districts/${encodeURIComponent(slug)}/regulations`
      ),
    enabled: !!slug,
  });
}

export function usePublicServiceTypes(slug: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-service-types", slug],
    queryFn: () =>
      fetchPublic<ApiEnvelope<PublicServiceTypeItem[]>>(
        `${baseUrl}/api/v1/publish/services/types?district_slug=${encodeURIComponent(slug)}`
      ),
    enabled: !!slug,
  });
}

export function useTrackServiceRequest(registrationNumber: string) {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["publish-track-service", registrationNumber],
    queryFn: () =>
      fetchPublic<ApiEnvelope<PublicServiceTrackResponse>>(
        `${baseUrl}/api/v1/publish/services/track/${encodeURIComponent(registrationNumber)}`
      ),
    enabled: !!registrationNumber.trim(),
    retry: false,
  });
}
