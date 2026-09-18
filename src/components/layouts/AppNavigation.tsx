"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCategory2,
  IconChevronDown,
  IconCoins,
  IconLayoutDashboard,
  IconLogout,
  IconSettings,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";
import type { CurrentUser } from "@/features/auth/services/auth";
import { getNavigationItems } from "@/config/nav";
import { ROLE_LABELS } from "@/types/role";
import { logout } from "@/app/auth-actions";

function NavigationIcon({ href }: { href: string }) {
  if (href === "/settings/members") return <IconUsers aria-hidden className="h-4 w-4" />;
  if (href === "/settings/payers") return <IconCoins aria-hidden className="h-4 w-4" />;
  if (href === "/settings/categories") return <IconCategory2 aria-hidden className="h-4 w-4" />;
  if (href === "/settings") return <IconSettings aria-hidden className="h-4 w-4" />;
  return <IconLayoutDashboard aria-hidden className="h-4 w-4" />;
}

export function AppNavigation({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const navigationItems = getNavigationItems(user.role);
  const [toggledSections, setToggledSections] = useState<ReadonlySet<string>>(new Set());

  function toggleSection(href: string) {
    setToggledSections((current) => {
      const next = new Set(current);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <IconWallet aria-hidden className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">Expense Desk</span>
            <span className="block text-xs text-sidebar-muted">ระบบเบิก-จ่ายค่าใช้จ่าย</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="mt-10">
          <p className="px-3 text-[11px] font-semibold tracking-[0.12em] text-sidebar-muted uppercase">เมนูหลัก</p>
          <ul className="mt-3 flex flex-col gap-1">
            {navigationItems.map((item) => {
              const childActive = item.children?.some((child) => pathname.startsWith(child.href)) ?? false;
              const active = !childActive && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
              const defaultOpen = childActive || active;
              const open = toggledSections.has(item.href) ? !defaultOpen : defaultOpen;

              return (
                <li key={item.href}>
                  <div className={`flex items-center rounded-lg text-sm font-medium transition-colors ${active ? "bg-white/12 text-white shadow-sm" : "text-sidebar-foreground hover:bg-white/7 hover:text-white"}`}>
                    <Link href={item.href} aria-current={active ? "page" : undefined} className="flex flex-1 items-center gap-3 px-3 py-2.5">
                      <NavigationIcon href={item.href} />
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        type="button"
                        onClick={() => toggleSection(item.href)}
                        aria-expanded={open}
                        aria-label={open ? `ย่อเมนู${item.label}` : `ขยายเมนู${item.label}`}
                        className="mr-1 rounded-lg p-2"
                      >
                        <IconChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  {item.children && open && (
                    <ul className="mt-1 flex flex-col gap-1 pl-8">
                      {item.children.map((child) => {
                        const childCurrent = pathname.startsWith(child.href);
                        return (
                          <li key={child.href}>
                            <Link href={child.href} aria-current={childCurrent ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${childCurrent ? "bg-white/12 text-white shadow-sm" : "text-sidebar-foreground hover:bg-white/7 hover:text-white"}`}>
                              <NavigationIcon href={child.href} />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto px-3">
          <p className="text-sm font-medium text-white">{user.displayName}</p>
          <p className="mt-0.5 text-xs text-sidebar-muted">{ROLE_LABELS[user.role]}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="inline-flex items-center gap-2 text-xs text-sidebar-muted transition-colors hover:text-white">
              <IconLogout aria-hidden className="h-4 w-4" /> ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><IconWallet aria-hidden className="h-4 w-4" /></span>
          Expense Desk
        </Link>
        <form action={logout}>
          <button type="submit" aria-label="ออกจากระบบ" className="rounded-lg p-2 text-muted hover:bg-muted-surface hover:text-foreground"><IconLogout aria-hidden className="h-4 w-4" /></button>
        </form>
      </header>

      <nav aria-label="เมนูหลักบนมือถือ" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-md items-center justify-around gap-1">
          {navigationItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${active ? "bg-primary-tint text-primary" : "text-muted hover:bg-muted-surface hover:text-foreground"}`}>
                  <NavigationIcon href={item.href} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
