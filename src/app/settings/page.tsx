import Link from "next/link";
import { IconCategory2, IconCoins, IconUsers } from "@tabler/icons-react";
import { requireRole, requireUser } from "@/features/auth/services/auth";
import { getSettingsOverviewCounts } from "./queries";

export default async function SettingsPage() {
  requireRole(await requireUser(), "admin");
  const { payerCount, categoryCount, memberCount } = await getSettingsOverviewCounts();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">ตั้งค่า</h1>
        <p className="mt-2 text-sm text-muted">จัดการผู้จ่าย/ผู้สำรอง ประเภทค่าใช้จ่าย และสมาชิกของระบบ</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SettingsLinkCard
          href="/settings/payers"
          icon={<IconCoins aria-hidden className="h-5 w-5" />}
          label="ผู้จ่าย/ผู้สำรอง"
          value={payerCount}
          detail="พร้อมใช้งานในแบบฟอร์มรายการ"
        />
        <SettingsLinkCard
          href="/settings/categories"
          icon={<IconCategory2 aria-hidden className="h-5 w-5" />}
          label="ประเภทค่าใช้จ่าย"
          value={categoryCount}
          detail="จัดระเบียบการบันทึกค่าใช้จ่าย"
        />
        <SettingsLinkCard
          href="/settings/members"
          icon={<IconUsers aria-hidden className="h-5 w-5" />}
          label="สมาชิก"
          value={memberCount}
          detail="จัดการบัญชีผู้ใช้งาน"
        />
      </div>
    </div>
  );
}

function SettingsLinkCard({
  href,
  icon,
  label,
  value,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-tint text-primary">{icon}</span>
      <p className="mt-3 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Link>
  );
}
