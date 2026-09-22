import { Noto_Sans_Thai } from "next/font/google";
import type { CurrentUser } from "@/features/auth/services/auth";
import { ROLE_LABELS } from "@/types/role";
import { AppNavigation } from "./AppNavigation";
import { ThemeToggle } from "./ThemeToggle";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return displayName.trim().split("@")[0].slice(0, 2).toUpperCase();
}

export function RootLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser | null;
}) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router root layout is the
          documented place for a blocking inline theme script; this rule predates that pattern. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background">
        {user && !user.mustChangePassword ? (
          <div className="flex min-h-screen flex-col lg:flex-row">
            <AppNavigation user={user} />
            <main className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
              <div className="hidden h-16 items-center justify-end gap-3 border-b border-border bg-card px-8 lg:flex">
                <ThemeToggle />
                <div aria-hidden className="h-6 w-px bg-border" />
                <div className="min-w-0 max-w-xs text-right">
                  <p className="truncate text-sm font-medium text-foreground">{user.displayName}</p>
                  <p className="truncate text-xs text-muted">{ROLE_LABELS[user.role]}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {getInitials(user.displayName)}
                </span>
              </div>
              {children}
            </main>
          </div>
        ) : (
          <main className="flex min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
