"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { calculateTotalPages } from "@/utilities/pagination";

interface PaginationBarProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  page,
  limit,
  total,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = calculateTotalPages(total, limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs opacity-80">
      <span>
        Menampilkan <strong>{start}</strong>–<strong>{end}</strong> dari{" "}
        <strong>{total}</strong> data
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg admin-glass disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Sebelumnya
        </button>
        <span className="px-2.5 py-1 font-semibold">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg admin-glass disabled:opacity-40 cursor-pointer"
        >
          Berikutnya
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
