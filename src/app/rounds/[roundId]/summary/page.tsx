import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconReceipt } from "@tabler/icons-react";
import { formatCurrencyTHB } from "@/lib/format";
import {
  ROUND_STATUS_BADGE_CLASSES,
  ROUND_STATUS_LABELS,
} from "@/lib/round-status";
import { ReceiptGalleryModal } from "../ReceiptGalleryModal";
import {
  getExpenseItems,
  getReceiptsForRound,
  getRound,
  type Receipt,
} from "../queries";
import { PrintButton } from "./PrintButton";

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

export default async function RoundSummaryPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId: roundIdParam } = await params;
  const roundId = Number(roundIdParam);
  const round = Number.isInteger(roundId) ? await getRound(roundId) : undefined;
  if (!round) notFound();

  const [items, receipts] = await Promise.all([
    getExpenseItems(roundId),
    getReceiptsForRound(roundId),
  ]);
  const grandTotalSatang = items.reduce(
    (sum, item) => sum + item.amountSatang,
    0
  );
  const receiptsByItemId = new Map<number, Receipt[]>();

  for (const receipt of receipts) {
    const receipts = receiptsByItemId.get(receipt.itemId) ?? [];
    receipts.push(receipt);
    receiptsByItemId.set(receipt.itemId, receipts);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/rounds/${roundId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          <IconArrowLeft aria-hidden className="h-4 w-4" /> กลับรายละเอียดรอบ
        </Link>
        <PrintButton />
      </header>

      <article className="rounded-xl border border-border bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-border p-5 sm:p-6 print:px-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            รายการเบิก
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {round.name}
            </h1>
            <span
              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${ROUND_STATUS_BADGE_CLASSES[round.status]}`}
            >
              {ROUND_STATUS_LABELS[round.status]}
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted">วันที่สร้างรอบ</p>
              <p className="mt-1 text-foreground">
                {new Date(round.createdAt).toLocaleDateString("th-TH", {
                  dateStyle: "long",
                })}
              </p>
            </div>
            {round.note && (
              <div>
                <p className="text-xs font-medium text-muted">หมายเหตุ</p>
                <p className="mt-1 text-foreground">{round.note}</p>
              </div>
            )}
          </div>
        </header>

        <section className="p-5 sm:p-6 print:px-0" aria-labelledby="summary-items-heading">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="summary-items-heading" className="text-sm font-semibold">
                รายการค่าใช้จ่าย
              </h2>
              <p className="mt-0.5 text-xs text-muted">{items.length} รายการ</p>
            </div>
            <div className="rounded-lg bg-primary-tint px-4 py-2 text-right text-primary">
              <p className="text-xs font-medium">รวมค่าใช้จ่าย</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">
                {formatCurrencyTHB(grandTotalSatang)}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">ยังไม่มีรายการค่าใช้จ่าย</p>
          ) : (
            <>
              <ul className="mt-4 flex flex-col gap-3 md:hidden">
                {items.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(item.expenseDate).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">
                        {formatCurrencyTHB(item.amountSatang)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 ${getCategoryBadgeClass(item.categoryId)}`}
                      >
                        {item.categoryName ?? "ไม่ระบุประเภท"}
                      </span>
                      <span className="rounded-full bg-muted-surface px-2.5 py-1 text-muted">
                        {item.payerName ?? "ไม่ระบุผู้จ่าย"}
                      </span>
                      <span className="print:hidden">
                        <ReceiptGalleryModal
                          roundId={roundId}
                          itemId={item.id}
                          receipts={receiptsByItemId.get(item.id) ?? []}
                        />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-190 border-collapse text-xs">
                  <thead>
                    <tr className="border-y border-border bg-muted-surface text-left text-muted print:bg-transparent">
                      <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                        วันที่
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                        รายละเอียด
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                        ประเภท
                      </th>
                      <th className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                        ผู้จ่าย
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">
                        จำนวนเงิน
                      </th>
                      <th className="w-px whitespace-nowrap px-2 py-2 text-xs font-semibold tracking-wide uppercase print:hidden">
                        หลักฐาน
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {new Date(item.expenseDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-3 py-2 font-medium">{item.description}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2.5 py-1 ${getCategoryBadgeClass(item.categoryId)}`}
                          >
                            {item.categoryName ?? "ไม่ระบุประเภท"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-muted-surface px-2.5 py-1 text-muted">
                            {item.payerName ?? "ไม่ระบุผู้จ่าย"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                          {formatCurrencyTHB(item.amountSatang)}
                        </td>
                        <td className="w-px whitespace-nowrap px-2 py-2 print:hidden">
                          <ReceiptGalleryModal
                            roundId={roundId}
                            itemId={item.id}
                            receipts={receiptsByItemId.get(item.id) ?? []}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

      </article>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted print:hidden">
        <IconReceipt aria-hidden className="h-3.5 w-3.5" /> เอกสารสรุปรายการเบิก
      </p>
    </div>
  );
}
