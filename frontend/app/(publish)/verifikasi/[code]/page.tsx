"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldX } from "lucide-react";
import { fetchPublic } from "@/lib/api";
import { useUrlStore } from "@/store/useUrlStore";
import { ApiEnvelope } from "@/types/global";
import { formatDateTimeId } from "@/utilities/pagination";

interface Verification {
  valid: boolean;
  letter_number: string;
  service_type_name: string;
  district_name: string;
  applicant_name_masked: string;
  signed_at: string | null;
}

export default function VerifikasiSuratPage() {
  const { code } = useParams<{ code: string }>();
  const baseUrl = useUrlStore((s) => s.URL.APP);
  const q = useQuery({
    queryKey: ["verifikasi-surat", code],
    queryFn: () => fetchPublic<ApiEnvelope<Verification>>(`${baseUrl}/api/v1/publish/verifikasi/${encodeURIComponent(code)}`),
    retry: false,
  });
  const d = q.data?.data;

  return (
    <div className="container-page py-10">
      <div className="clay-card card-accent mx-auto max-w-lg space-y-4 p-7 text-center">
        {q.isLoading ? (
          <p className="py-8 text-sm text-slate-600" role="status">Memeriksa keaslian surat…</p>
        ) : d?.valid ? (
          <>
            <BadgeCheck className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
            <h1 className="text-2xl text-slate-900">Surat Sah</h1>
            <p className="text-sm text-slate-600">Surat ini terdaftar dan telah ditandatangani secara elektronik.</p>
            <dl className="space-y-2 rounded-2xl bg-white/70 p-4 text-left text-sm">
              <div><dt className="text-xs text-slate-500">Nomor surat</dt><dd className="font-mono font-semibold">{d.letter_number}</dd></div>
              <div><dt className="text-xs text-slate-500">Jenis surat</dt><dd className="font-semibold">{d.service_type_name}</dd></div>
              <div><dt className="text-xs text-slate-500">Diterbitkan oleh</dt><dd className="font-semibold">Kecamatan {d.district_name}</dd></div>
              <div><dt className="text-xs text-slate-500">Atas nama</dt><dd className="font-semibold">{d.applicant_name_masked}</dd></div>
              <div><dt className="text-xs text-slate-500">Ditandatangani</dt><dd className="font-semibold">{formatDateTimeId(d.signed_at)}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto h-12 w-12 text-red-600" aria-hidden />
            <h1 className="text-2xl text-slate-900">Surat Tidak Ditemukan</h1>
            <p className="text-sm text-slate-600">
              Kode verifikasi tidak terdaftar atau surat belum ditandatangani. Jika Anda memegang surat cetak, jangan
              percaya dokumen ini sebelum dikonfirmasi ke kantor kecamatan.
            </p>
          </>
        )}
        <Link href="/" className="clay-btn clay-btn-glass mx-auto px-5 py-2.5 text-sm">Ke Beranda</Link>
      </div>
    </div>
  );
}
