import type { SelectHTMLAttributes } from "react";
import { IconChevronDown } from "@tabler/icons-react";

/** Native `<select>` with the OS-default arrow swapped for one matching the rest of the UI. */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {children}
      </select>
      <IconChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
