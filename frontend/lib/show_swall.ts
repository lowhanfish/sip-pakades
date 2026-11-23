import Swal, { SweetAlertIcon } from "sweetalert2";

export function swallAlert(
  title: string,
  icon: SweetAlertIcon = "info",
  text?: string
) {
  return Swal.fire({
    title,
    text,
    icon,
    timer: icon === "success" ? 2200 : undefined,
    showConfirmButton: icon !== "success",
    confirmButtonColor: "#0284c7",
    customClass: {
      popup: "rounded-2xl backdrop-blur-md",
    },
  });
}

export function showLoadingAlert(title = "Memproses data...") {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeSwallAlert() {
  Swal.close();
}

export async function confirmDeleteAlert(
  itemLabel = "data ini"
): Promise<boolean> {
  const result = await Swal.fire({
    title: "Konfirmasi Hapus",
    text: `Apakah Anda yakin ingin menghapus ${itemLabel}? Tindakan ini tidak dapat dibatalkan.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
  });
  return result.isConfirmed;
}
