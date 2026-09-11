import Link from "next/link";
import { formatCurrencyTHB } from "@/lib/format";
import { InboxIcon } from "@/components/icons/icons";
import { CreateRoundModal } from "./CreateRoundModal";
import { DeleteRoundButton } from "./DeleteRoundButton";
import { RoundStatusSelect } from "./RoundStatusSelect";
import { getRounds } from "./queries";

export default async function Home() {
  const rounds = getRounds();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">
          รายการรอบเบิก-จ่าย
        </h1>
        <CreateRoundModal />
      </div>

      {rounds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center text-muted">
          <InboxIcon />
          <p className="text-sm">
            ยังไม่มีรอบ กด &quot;สร้างรอบใหม่&quot; เพื่อเริ่มบันทึก
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rounds.map((round) => (
              <li
                key={round.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/rounds/${round.id}`}
                    className="font-medium hover:underline"
                  >
                    {round.name}
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded bg-primary-tint px-2 py-0.5 text-xs font-medium text-primary">
                      {round.itemCount} รายการ
                    </span>
                    <DeleteRoundButton roundId={round.id} roundName={round.name} />
                  </div>
                </div>
                {round.note && (
                  <p className="text-sm text-muted">{round.note}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <RoundStatusSelect roundId={round.id} status={round.status} />
                  <span className="text-muted">
                    {new Date(round.createdAt).toLocaleDateString("th-TH")}
                  </span>
                  <span className="font-semibold">
                    {formatCurrencyTHB(round.totalSatang)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-[0_2px_5px_rgba(0,0,0,0.1)] md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-muted">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">ชื่อรอบ</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">หมายเหตุ</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">จำนวนรายการ</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">ยอดรวม</th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">สร้างเมื่อ</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rounds.map((round) => (
                  <tr
                    key={round.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/2"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/rounds/${round.id}`}
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        {round.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {round.note ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <RoundStatusSelect
                        roundId={round.id}
                        status={round.status}
                      />
                    </td>
                    <td className="px-4 py-3">{round.itemCount}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrencyTHB(round.totalSatang)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(round.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteRoundButton
                        roundId={round.id}
                        roundName={round.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
