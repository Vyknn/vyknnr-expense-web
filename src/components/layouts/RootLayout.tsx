import { Noto_Sans_Thai } from "next/font/google";
import type { CurrentUser } from "@/features/auth/services/auth";
import { AppNavigation } from "./AppNavigation";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

export function RootLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser | null;
}) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full bg-background">
        {user && !user.mustChangePassword ? (
          <div className="flex min-h-screen">
            <AppNavigation user={user} />
            <main className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
              <div className="hidden h-16 items-center justify-end border-b border-border bg-card px-8 lg:flex">
                <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-medium text-muted">
                  {user.displayName} · {user.email}
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
