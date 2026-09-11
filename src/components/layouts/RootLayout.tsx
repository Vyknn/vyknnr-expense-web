import { Roboto } from "next/font/google";
import Link from "next/link";
import { WalletIcon } from "@/components/icons/icons";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card shadow-[0_2px_5px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <WalletIcon className="h-4 w-4" />
              </span>
              ระบบเบิก-จ่ายค่าใช้จ่าย
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
