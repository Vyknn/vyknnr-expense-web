import Link from "next/link";
import { IconInbox } from "@tabler/icons-react";
import { formatCurrencyTHB } from "@/lib/format";
import { CreateRoundModal } from "./CreateRoundModal";
import { DeleteRoundButton } from "./DeleteRoundButton";
import {
  ROUND_STATUS_BADGE_CLASSES,
  ROUND_STATUS_LABELS,
} from "@/lib/round-status";
import { getRounds } from "./queries";
import { requireUser } from "@/features/auth/services/auth";
import { canManageExpenses } from "@/types/role";

export default async function Home() {
  const user = await requireUser();
  const rounds = await getRounds();
  const canEdit = canManageExpenses(user.role);
  const totalSatang = rounds.reduce((sum, round) => sum + round.totalSatang, 0);
  const totalItems = rounds.reduce((sum, round) => sum + round.itemCount, 0);
  const activeRounds = rounds.filter((round) => round.status === "in_progress").length;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">ภาพรวมค่าใช้จ่าย</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">รายการรอบเบิก-จ่าย</h1>
          <p className="mt-2 text-sm text-muted">ติดตามรายการ, ยอดรวม และสถานะของทุกการเบิก-จ่าย</p>
        </div>
        {canEdit && <CreateRoundModal />}
      </header>

      <section aria-label="สรุปรอบเบิก-จ่าย" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="ยอดเบิกจ่ายทั้งหมด" value={formatCurrencyTHB(totalSatang)} detail="รวมทุกรอบ" tone="primary" />
        <SummaryCard label="รายการค่าใช้จ่าย" value={`${totalItems} รายการ`} detail={`จาก ${rounds.length} รอบเบิก-จ่าย`} />
        <SummaryCard label="รอดำเนินการ" value={`${activeRounds} รอบ`} detail={activeRounds > 0 ? "ติดตามและอัปเดตสถานะได้" : "ไม่มีรอบที่รอดำเนินการ"} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold">ทะเบียนรอบเบิก-จ่าย</h2>
            <p className="mt-0.5 text-sm text-muted">ทั้งหมด {rounds.length} รอบ</p>
          </div>
          <span className="self-start rounded-full bg-muted-surface px-3 py-1 text-xs font-medium text-muted sm:self-auto">
            อัปเดตล่าสุดจากรายการปัจจุบัน
          </span>
        </div>

        {rounds.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-18 text-center text-muted">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary"><IconInbox aria-hidden className="h-7 w-7" /></span>
            <div><p className="font-medium text-foreground">ยังไม่มีรอบเบิก-จ่าย</p><p className="mt-1 text-sm">กด &quot;สร้างรอบใหม่&quot; เพื่อเริ่มบันทึก</p></div>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {rounds.map((round) => (
                <li key={round.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><Link href={`/rounds/${round.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{round.name}</Link>{round.note && <p className="mt-1 line-clamp-2 text-sm text-muted">{round.note}</p>}</div>
                    {canEdit && <DeleteRoundButton roundId={round.id} roundName={round.name} />}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div><p className="text-xs text-muted">ยอดรวม</p><p className="mt-0.5 font-semibold">{formatCurrencyTHB(round.totalSatang)}</p></div>
                    <div className="text-right"><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ROUND_STATUS_BADGE_CLASSES[round.status]}`}>{ROUND_STATUS_LABELS[round.status]}</span><p className="mt-1 text-xs text-muted">{round.itemCount} รายการ · {new Date(round.createdAt).toLocaleDateString("th-TH")}</p></div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-220 border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted-surface text-left text-muted">
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">ชื่อรอบ</th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">หมายเหตุ</th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">สถานะ</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold tracking-wide uppercase">จำนวนรายการ</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold tracking-wide uppercase">ยอดรวม</th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">สร้างเมื่อ</th>
                    <th className="w-14 px-4 py-3"><span className="sr-only">จัดการ</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round) => (
                    <tr key={round.id} className="border-b border-border last:border-0 hover:bg-muted-surface/70">
                      <td className="px-4 py-1.5"><Link href={`/rounds/${round.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{round.name}</Link></td>
                      <td className="max-w-70 truncate px-4 py-1.5 text-muted">{round.note ?? "-"}</td>
                      <td className="px-4 py-1.5"><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ROUND_STATUS_BADGE_CLASSES[round.status]}`}>{ROUND_STATUS_LABELS[round.status]}</span></td>
                      <td className="px-4 py-1.5 text-right tabular-nums">{round.itemCount}</td>
                      <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{formatCurrencyTHB(round.totalSatang)}</td>
                      <td className="whitespace-nowrap px-4 py-1.5 text-muted">{new Date(round.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-3 py-1.5">{canEdit && <DeleteRoundButton roundId={round.id} roundName={round.name} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail: string; tone?: "default" | "primary" }) {
  return <article className={`rounded-xl border p-4 shadow-sm ${tone === "primary" ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-card"}`}><p className={`text-sm ${tone === "primary" ? "text-primary-foreground/75" : "text-muted"}`}>{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className={`mt-1 text-xs ${tone === "primary" ? "text-primary-foreground/75" : "text-muted"}`}>{detail}</p></article>;
}
