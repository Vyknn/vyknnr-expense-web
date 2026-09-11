import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrencyTHB } from "@/lib/format";
import { ArrowLeftIcon } from "@/components/icons/icons";
import { DeleteRoundButton } from "@/app/DeleteRoundButton";
import { RoundStatusSelect } from "@/app/RoundStatusSelect";
import { AddExpenseItemModal } from "./AddExpenseItemModal";
import { DeleteItemButton } from "./DeleteItemButton";
import { EditExpenseItemModal } from "./EditExpenseItemModal";
import { ReceiptGalleryModal } from "./ReceiptGalleryModal";
import {
  getAllPayers,
  getExpenseItems,
  getPayerSummary,
  getReceiptsForRound,
  getRound,
  type Receipt,
} from "./queries";

export default async function RoundDetailPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId: roundIdParam } = await params;
  const roundId = Number(roundIdParam);

  const round = Number.isInteger(roundId) ? getRound(roundId) : undefined;
  if (!round) notFound();

  const items = getExpenseItems(roundId);
  const payerSummary = getPayerSummary(roundId);
  const allPayers = getAllPayers();
  const grandTotalSatang = payerSummary.reduce(
    (sum, p) => sum + p.totalSatang,
    0
  );

  const receiptsByItemId = new Map<number, Receipt[]>();
  for (const receipt of getReceiptsForRound(roundId)) {
    const list = receiptsByItemId.get(receipt.itemId) ?? [];
    list.push(receipt);
    receiptsByItemId.set(receipt.itemId, list);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          กลับหน้ารายการรอบ
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {round.name}
              </h1>
              <RoundStatusSelect roundId={roundId} status={round.status} />
            </div>
            {round.note && <p className="text-sm text-muted">{round.note}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AddExpenseItemModal roundId={roundId} payers={allPayers} />
            <DeleteRoundButton
              roundId={roundId}
              roundName={round.name}
              redirectHome
            />
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-[0_2px_5px_rgba(0,0,0,0.1)] sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          สรุปยอดต่อผู้จ่าย
        </h2>
        {payerSummary.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีรายการค่าใช้จ่าย</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {payerSummary.map((p) => (
              <li
                key={p.payerId}
                className="flex items-center justify-between text-sm"
              >
                <span>{p.payerName}</span>
                <span className="font-medium">
                  {formatCurrencyTHB(p.totalSatang)}
                </span>
              </li>
            ))}
            <li className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>ยอดรวมทั้งรอบ</span>
              <span className="text-primary">
                {formatCurrencyTHB(grandTotalSatang)}
              </span>
            </li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted">
          รายการค่าใช้จ่าย
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">
            ยังไม่มีรายการ กด &quot;เพิ่มรายการ&quot; เพื่อเริ่มบันทึก
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.description}</span>
                    <span className="shrink-0 font-semibold">
                      {formatCurrencyTHB(item.amountSatang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{item.payerName}</span>
                    <span>
                      {new Date(item.expenseDate).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <ReceiptGalleryModal
                      roundId={roundId}
                      itemId={item.id}
                      receipts={receiptsByItemId.get(item.id) ?? []}
                    />
                    <div className="flex items-center">
                      <EditExpenseItemModal
                        roundId={roundId}
                        item={item}
                        payers={allPayers}
                      />
                      <DeleteItemButton roundId={roundId} itemId={item.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-[0_2px_5px_rgba(0,0,0,0.1)] md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-left text-muted">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">วันที่</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">รายละเอียด</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">ผู้จ่าย</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">ใบเสร็จ</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-foreground/2"
                    >
                      <td className="px-4 py-3 text-muted">
                        {new Date(item.expenseDate).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3">{item.payerName}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrencyTHB(item.amountSatang)}
                      </td>
                      <td className="px-4 py-3">
                        <ReceiptGalleryModal
                          roundId={roundId}
                          itemId={item.id}
                          receipts={receiptsByItemId.get(item.id) ?? []}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <EditExpenseItemModal
                            roundId={roundId}
                            item={item}
                            payers={allPayers}
                          />
                          <DeleteItemButton
                            roundId={roundId}
                            itemId={item.id}
                          />
                        </div>
                      </td>
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
