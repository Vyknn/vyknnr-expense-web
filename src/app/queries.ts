import "server-only";
import { db } from "@/lib/db";
import type { RoundStatus } from "@/lib/round-status";

export type RoundListItem = {
  id: number;
  name: string;
  note: string | null;
  status: RoundStatus;
  createdAt: string;
  itemCount: number;
  totalSatang: number;
};

export function getRounds(): RoundListItem[] {
  const rows = db
    .prepare(
      `SELECT
         r.id AS id,
         r.name AS name,
         r.note AS note,
         r.status AS status,
         r.created_at AS createdAt,
         COUNT(i.id) AS itemCount,
         COALESCE(SUM(i.amount_satang), 0) AS totalSatang
       FROM expense_rounds r
       LEFT JOIN expense_items i ON i.round_id = r.id
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    )
    .all() as RoundListItem[];

  return rows;
}
