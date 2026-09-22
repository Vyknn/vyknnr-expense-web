"use client";

import { useLayoutEffect, useState } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";

function readIsDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  return stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(readIsDark);

  // Re-applies the class the blocking <head> script already set on first paint. Needed because
  // React Strict Mode's dev-only remount resets <html> to only the attributes JSX manages,
  // clearing it — see next/dist/docs preventing-flash-before-hydration.md. No-op in production.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  function toggle() {
    const next = !isDark;
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      className="rounded-lg p-2 text-muted transition-colors hover:bg-muted-surface hover:text-foreground"
    >
      {isDark ? <IconSun aria-hidden className="h-5 w-5" /> : <IconMoon aria-hidden className="h-5 w-5" />}
    </button>
  );
}
