"use client";

import Swal from "sweetalert2";
import { IconLink } from "@tabler/icons-react";

export function ShareRoundLinkButton({ publicToken }: { publicToken: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}/rounds/public/${publicToken}`;
        await navigator.clipboard.writeText(url);
        await Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "คัดลอกลิงก์แชร์แล้ว",
          timer: 1500,
          showConfirmButton: false,
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
    >
      <IconLink aria-hidden className="h-4 w-4" />
      แชร์
    </button>
  );
}
