"use client";

import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiEnvelope, OptionItem } from "@/types/global";
import { DesaFormInput, DesaItem, DesaListResponse } from "../types";
import { swallAlert } from "@/lib/show_swall";
import { calculateSkip } from "@/utilities/pagination";

export const useDesaOption = (districtId = "") => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["master-desa-option", districtId],
    queryFn: () => {
      const qs = districtId ? `?district_id=${encodeURIComponent(districtId)}` : "";
      return fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/desa/option${qs}`);
    },
  });
};

export const useDesaList = (
  page: number,
  limit: number,
  search = "",
  districtId = "",
  typeFilter = ""
) => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const skip = calculateSkip(page, limit);
  return useQuery({
    queryKey: ["master-desa", page, limit, search, districtId, typeFilter],
    queryFn: () => {
      const q = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });
      if (search) q.set("search", search);
      if (districtId) q.set("district_id", districtId);
      if (typeFilter) q.set("type", typeFilter);
      return fetchData<DesaListResponse>(
        `${baseUrl}/api/v1/admin/master/desa/read?${q.toString()}`
      );
    },
  });
};

export const useCreateDesa = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DesaFormInput) =>
      fetchData<ApiEnvelope<DesaItem>>(`${baseUrl}/api/v1/admin/master/desa/create`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-desa"] });
      queryClient.invalidateQueries({ queryKey: ["master-desa-option"] });
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan"] });
      swallAlert(res.message || "Desa/Kelurahan berhasil ditambahkan", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menambah", "error", err.message);
    },
  });
};

export const useUpdateDesa = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DesaFormInput }) =>
      fetchData<ApiEnvelope<DesaItem>>(
        `${baseUrl}/api/v1/admin/master/desa/update/${id}`,
        { method: "PUT", body: payload }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-desa"] });
      queryClient.invalidateQueries({ queryKey: ["master-desa-option"] });
      swallAlert(res.message || "Desa/Kelurahan berhasil diperbarui", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Memperbarui", "error", err.message);
    },
  });
};

export const useDeleteDesa = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchData<ApiEnvelope<{ id: string }>>(
        `${baseUrl}/api/v1/admin/master/desa/delete/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-desa"] });
      queryClient.invalidateQueries({ queryKey: ["master-desa-option"] });
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan"] });
      swallAlert(res.message || "Desa/Kelurahan berhasil dihapus", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menghapus", "error", err.message);
    },
  });
};
