"use client";

import { IconPrinter } from "@tabler/icons-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none print:hidden"
    >
      <IconPrinter aria-hidden className="h-4 w-4" />
      พิมพ์
    </button>
  );
}
