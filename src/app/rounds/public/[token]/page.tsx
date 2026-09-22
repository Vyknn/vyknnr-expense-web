import { notFound } from "next/navigation";
import { IconReceipt } from "@tabler/icons-react";
import { formatCurrencyTHB } from "@/lib/format";
import { ROUND_STATUS_BADGE_CLASSES, ROUND_STATUS_LABELS } from "@/lib/round-status";
import { PrintButton } from "./PrintButton";
import {
  getPublicExpenseItems,
  getPublicPayerSummary,
  getPublicReceiptsForRound,
  getPublicRound,
  type PublicReceipt,
} from "./queries";

export default async function PublicRoundPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const round = await getPublicRound(token);
  if (!round) notFound();

  const [items, payerSummary, allReceipts] = await Promise.all([
    getPublicExpenseItems(round.id),
    getPublicPayerSummary(round.id),
    getPublicReceiptsForRound(round.id),
  ]);

  const grandTotalSatang = items.reduce((sum, item) => sum + item.amountSatang, 0);
  const receiptsByItemId = new Map<number, PublicReceipt[]>();
  for (const receipt of allReceipts) {
    const receipts = receiptsByItemId.get(receipt.itemId) ?? [];
    receipts.push(receipt);
    receiptsByItemId.set(receipt.itemId, receipts);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-8">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b-2 border-dashed border-border px-6 py-5 text-center">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            Expense Desk
          </p>
          <p className="text-xs text-muted">ระบบเบิก-จ่ายค่าใช้จ่าย</p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">{round.name}</h1>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs">
            <span
              className={`inline-flex rounded px-2 py-0.5 font-medium ${ROUND_STATUS_BADGE_CLASSES[round.status]}`}
            >
              {ROUND_STATUS_LABELS[round.status]}
            </span>
            <span className="text-muted">
              {new Date(round.createdAt).toLocaleDateString("th-TH", {
                dateStyle: "long",
              })}
            </span>
          </div>
          {round.note && <p className="mt-2 text-sm text-muted">{round.note}</p>}
        </div>

        <div className="px-6 py-5">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">ยังไม่มีรายการค่าใช้จ่ายในรอบนี้</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => {
                const receipts = receiptsByItemId.get(item.id) ?? [];
                return (
                  <li key={item.id} className="flex flex-col gap-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{item.description}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(item.expenseDate).toLocaleDateString("th-TH")}
                          {" · "}
                          {item.categoryName ?? "ไม่ระบุประเภท"}
                          {" · "}
                          {item.payerName ?? "ไม่ระบุผู้จ่าย"}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">
                        {formatCurrencyTHB(item.amountSatang)}
                      </p>
                    </div>

                    {receipts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {receipts.map((receipt) => {
                          const href = `/rounds/public/${token}/receipts/${item.id}/${receipt.id}`;
                          const isImage = receipt.mimeType.startsWith("image/");

                          return (
                            <a
                              key={receipt.id}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-foreground/2 transition-opacity hover:opacity-80"
                            >
                              {isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element -- GCS-backed binary route, not an optimizable static asset
                                <img src={href} alt="หลักฐาน" className="h-full w-full object-cover" />
                              ) : (
                                <IconReceipt aria-hidden className="h-5 w-5 text-muted" />
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t-2 border-dashed border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">ยอดรวมทั้งรอบ</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrencyTHB(grandTotalSatang)}
            </p>
          </div>

          {payerSummary.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
              {payerSummary.map((payer) => (
                <li
                  key={payer.payerName ?? "unassigned"}
                  className="flex items-center justify-between text-xs text-muted"
                >
                  <span>{payer.payerName ?? "ไม่ระบุผู้จ่าย"}</span>
                  <span className="tabular-nums">{formatCurrencyTHB(payer.totalSatang)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted print:hidden">
        ลิงก์นี้เป็นมุมมองแบบอ่านอย่างเดียว ไม่ต้องเข้าสู่ระบบ
      </p>
    </div>
  );
}
