"use client";

import { fetchData } from "@/lib/api_secure";
import { useUrlStore } from "@/store/useUrlStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiEnvelope, OptionItem } from "@/types/global";
import {
  KecamatanFormInput,
  KecamatanItem,
  KecamatanListResponse,
} from "../types";
import { swallAlert } from "@/lib/show_swall";
import { calculateSkip } from "@/utilities/pagination";

export const useKecamatanOption = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  return useQuery({
    queryKey: ["master-kecamatan-option"],
    queryFn: () =>
      fetchData<OptionItem[]>(`${baseUrl}/api/v1/admin/master/kecamatan/option`),
  });
};

export const useKecamatanList = (
  page: number,
  limit: number,
  search = ""
) => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const skip = calculateSkip(page, limit);
  return useQuery({
    queryKey: ["master-kecamatan", page, limit, search],
    queryFn: () =>
      fetchData<KecamatanListResponse>(
        `${baseUrl}/api/v1/admin/master/kecamatan/read?skip=${skip}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      ),
  });
};

export const useCreateKecamatan = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: KecamatanFormInput) =>
      fetchData<ApiEnvelope<KecamatanItem>>(
        `${baseUrl}/api/v1/admin/master/kecamatan/create`,
        { method: "POST", body: payload }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan"] });
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan-option"] });
      swallAlert(res.message || "Kecamatan berhasil ditambahkan", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menambah", "error", err.message);
    },
  });
};

export const useUpdateKecamatan = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: KecamatanFormInput }) =>
      fetchData<ApiEnvelope<KecamatanItem>>(
        `${baseUrl}/api/v1/admin/master/kecamatan/update/${id}`,
        { method: "PUT", body: payload }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan"] });
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan-option"] });
      swallAlert(res.message || "Kecamatan berhasil diperbarui", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Memperbarui", "error", err.message);
    },
  });
};

export const useDeleteKecamatan = () => {
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchData<ApiEnvelope<{ id: string }>>(
        `${baseUrl}/api/v1/admin/master/kecamatan/delete/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan"] });
      queryClient.invalidateQueries({ queryKey: ["master-kecamatan-option"] });
      swallAlert(res.message || "Kecamatan berhasil dihapus", "success");
    },
    onError: (err: Error) => {
      swallAlert("Gagal Menghapus", "error", err.message);
    },
  });
};
