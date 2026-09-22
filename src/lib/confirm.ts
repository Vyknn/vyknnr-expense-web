import "client-only";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const CONFIRM_BUTTON_CLASS =
  "rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none";
const CANCEL_BUTTON_CLASS =
  "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none";

export async function confirmDelete(options: {
  title: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: options.confirmText ?? "ลบ",
    cancelButtonText: "ยกเลิก",
    buttonsStyling: false,
    customClass: {
      confirmButton: CONFIRM_BUTTON_CLASS,
      cancelButton: CANCEL_BUTTON_CLASS,
      actions: "flex gap-2",
    },
  });

  return result.isConfirmed;
}
