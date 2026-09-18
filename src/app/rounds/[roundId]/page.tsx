import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconArrowLeft,
  IconInbox,
  IconReceipt,
  IconWallet,
} from "@tabler/icons-react";
import { DeleteRoundButton } from "@/app/DeleteRoundButton";
import { EditRoundModal } from "@/app/EditRoundModal";
import { formatCurrencyTHB } from "@/lib/format";
import {
  ROUND_STATUS_BADGE_CLASSES,
  ROUND_STATUS_LABELS,
} from "@/lib/round-status";
import { AddExpenseItemModal } from "./AddExpenseItemModal";
import { DeleteItemButton } from "./DeleteItemButton";
import { EditExpenseItemModal } from "./EditExpenseItemModal";
import { ReceiptGalleryModal } from "./ReceiptGalleryModal";
import { requireUser } from "@/features/auth/services/auth";
import { canManageExpenses } from "@/types/role";
import {
  getAllExpenseCategories,
  getAllPayers,
  getExpenseItems,
  getPayerSummary,
  getReceiptsForRound,
  getRound,
  type Receipt,
} from "./queries";

const categoryBadgeClasses = [
  "bg-primary-tint text-primary",
  "bg-info-tint text-info",
  "bg-success-tint text-success",
  "bg-destructive-tint text-destructive",
] as const;

function getCategoryBadgeClass(categoryId: number | null) {
  if (categoryId === null) return "bg-muted-surface text-muted";

  return categoryBadgeClasses[(categoryId - 1) % categoryBadgeClasses.length];
}

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId: roundIdParam } = await params;
  const user = await requireUser();
  const roundId = Number(roundIdParam);
  const round = Number.isInteger(roundId) ? await getRound(roundId) : undefined;
  if (!round) notFound();

  const [items, payerSummary, allPayers, allCategories, allReceipts] = await Promise.all([
    getExpenseItems(roundId),
    getPayerSummary(roundId),
    getAllPayers(),
    getAllExpenseCategories(),
    getReceiptsForRound(roundId),
  ]);
  const canEdit = canManageExpenses(user.role);
  const grandTotalSatang = payerSummary.reduce((sum, payer) => sum + payer.totalSatang, 0);
  const receiptsByItemId = new Map<number, Receipt[]>();

  for (const receipt of allReceipts) {
    const receipts = receiptsByItemId.get(receipt.itemId) ?? [];
    receipts.push(receipt);
    receiptsByItemId.set(receipt.itemId, receipts);
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary">
          <IconArrowLeft aria-hidden className="h-4 w-4" /> กลับหน้ารายการรอบ
        </Link>
        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">รายละเอียดรอบเบิก-จ่าย</p>
            <div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{round.name}</h1><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ROUND_STATUS_BADGE_CLASSES[round.status]}`}>{ROUND_STATUS_LABELS[round.status]}</span></div>
            {round.note && <p className="mt-2 text-sm text-muted">{round.note}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{canEdit && <AddExpenseItemModal roundId={roundId} payers={allPayers} categories={allCategories} />}<Link href={`/rounds/${roundId}/summary`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"><IconReceipt aria-hidden className="h-4 w-4" />รายการเบิก</Link>{canEdit && <><EditRoundModal roundId={round.id} name={round.name} note={round.note} status={round.status} /><DeleteRoundButton roundId={roundId} roundName={round.name} redirectHome /></>}</div>
        </div>
      </header>

      <section aria-labelledby="summary-heading" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h2 id="summary-heading" className="text-sm font-semibold">สรุปยอดต่อผู้จ่าย</h2>
          <p className="mt-0.5 text-xs text-muted">กระจายยอดตามผู้จ่าย/ผู้สำรอง</p>
        </div>
        {payerSummary.length === 0 ? (
          <p className="py-8 text-sm text-muted">ยังไม่มีรายการค่าใช้จ่าย</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {payerSummary.map((payer) => {
                const payerName = payer.payerName ?? "ไม่ระบุผู้จ่าย";

                return (
                  <li
                    key={payer.payerId ?? "unassigned"}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-xs transition-shadow hover:shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                      <IconWallet aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" title={payerName}>{payerName}</p>
                      <p className="mt-0.5 text-xs text-muted">ยอดสะสมในรอบนี้</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatCurrencyTHB(payer.totalSatang)}</p>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary-tint px-4 py-3 text-xs">
              <div><p className="font-semibold text-primary">ยอดรวมทั้งรอบ</p><p className="mt-0.5 text-primary/75">รวมทุกรายการในรอบนี้</p></div>
              <p className="shrink-0 font-semibold text-primary tabular-nums">{formatCurrencyTHB(grandTotalSatang)}</p>
            </div>
          </div>
        )}
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-labelledby="items-heading">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><h2 id="items-heading" className="text-sm font-semibold">รายการค่าใช้จ่าย</h2><p className="mt-0.5 text-xs text-muted">{items.length} รายการในรอบนี้</p></div>
          <span className="self-start rounded-full bg-muted-surface px-3 py-1 text-xs font-medium text-muted sm:self-auto">บันทึกทุกรายการในรอบนี้</span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center text-muted"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary"><IconInbox aria-hidden className="h-7 w-7" /></span><div><p className="font-medium text-foreground">ยังไม่มีรายการค่าใช้จ่าย</p><p className="mt-1 text-sm">{canEdit ? "กด \"เพิ่มรายการ\" เพื่อเริ่มบันทึก" : "ยังไม่มีรายการในรอบนี้"}</p></div></div>
        ) : (
          <>
            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {items.map((item) => <li key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{item.description}</p><p className="shrink-0 font-semibold tabular-nums">{formatCurrencyTHB(item.amountSatang)}</p></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-2.5 py-1 ${getCategoryBadgeClass(item.categoryId)}`}>{item.categoryName ?? "ไม่ระบุประเภท"}</span><span className="rounded-full bg-muted-surface px-2.5 py-1 text-muted">{item.payerName ?? "ไม่ระบุผู้จ่าย"}</span><span className="px-1 py-1 text-muted">{new Date(item.expenseDate).toLocaleDateString("th-TH")}</span></div><div className="mt-3 flex items-center justify-between border-t border-border pt-3"><ReceiptGalleryModal roundId={roundId} itemId={item.id} receipts={receiptsByItemId.get(item.id) ?? []} />{canEdit && <div className="flex items-center"><EditExpenseItemModal roundId={roundId} item={item} payers={allPayers} categories={allCategories} /><DeleteItemButton roundId={roundId} itemId={item.id} /></div>}</div></li>)}
            </ul>

            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-220 border-collapse text-xs"><thead><tr className="border-b border-border bg-muted-surface text-left text-muted"><th className="whitespace-nowrap px-5 py-3 text-xs font-semibold tracking-wide uppercase">วันที่</th><th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">รายละเอียด</th><th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">ประเภท</th><th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">ผู้จ่าย</th><th className="px-5 py-3 text-right text-xs font-semibold tracking-wide uppercase">จำนวนเงิน</th><th className="w-px whitespace-nowrap px-2 py-3 text-xs font-semibold tracking-wide uppercase">ใบเสร็จ</th><th className="w-20 px-4 py-3"><span className="sr-only">จัดการ</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted-surface/70"><td className="whitespace-nowrap px-4 py-1.5 text-muted">{new Date(item.expenseDate).toLocaleDateString("th-TH")}</td><td className="px-4 py-1.5 font-medium">{item.description}</td><td className="px-4 py-1.5"><span className={`rounded-full px-2.5 py-1 text-xs ${getCategoryBadgeClass(item.categoryId)}`}>{item.categoryName ?? "ไม่ระบุประเภท"}</span></td><td className="px-4 py-1.5"><span className="rounded-full bg-muted-surface px-2.5 py-1 text-xs text-muted">{item.payerName ?? "ไม่ระบุผู้จ่าย"}</span></td><td className="whitespace-nowrap px-4 py-1.5 text-right font-semibold tabular-nums">{formatCurrencyTHB(item.amountSatang)}</td><td className="w-px whitespace-nowrap px-2 py-1.5"><ReceiptGalleryModal roundId={roundId} itemId={item.id} receipts={receiptsByItemId.get(item.id) ?? []} /></td><td className="px-3 py-1.5">{canEdit && <div className="flex items-center"><EditExpenseItemModal roundId={roundId} item={item} payers={allPayers} categories={allCategories} /><DeleteItemButton roundId={roundId} itemId={item.id} /></div>}</td></tr>)}</tbody></table></div>
          </>
        )}
      </section>
    </div>
  );
}
