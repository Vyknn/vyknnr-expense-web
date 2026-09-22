import "server-only";
import { queryRows } from "@/lib/db";
import type { RoundStatus } from "@/lib/round-status";
import { requireUser } from "@/features/auth/services/auth";

export type RoundListItem = {
  id: number;
  name: string;
  note: string | null;
  status: RoundStatus;
  createdAt: string;
  itemCount: number;
  totalSatang: number;
};

export async function getRounds(): Promise<RoundListItem[]> {
  await requireUser();
  const rows = await queryRows<Omit<RoundListItem, "itemCount" | "totalSatang"> & {
    itemCount: string;
    totalSatang: string;
  }>(
    `SELECT
       r.id AS id,
       r.name AS name,
       r.note AS note,
       r.status AS status,
       r.created_at AS "createdAt",
       COUNT(i.id) AS "itemCount",
       COALESCE(SUM(i.amount_satang), 0) AS "totalSatang"
     FROM expense_rounds r
     LEFT JOIN expense_items i ON i.round_id = r.id
     GROUP BY r.id
     ORDER BY r.created_at DESC`
  );

  return rows.map((row) => ({
    ...row,
    itemCount: Number(row.itemCount),
    totalSatang: Number(row.totalSatang),
  }));
}
