import "server-only";
import { queryRows } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";

export type PayerWithUsage = {
  id: number;
  name: string;
  createdAt: string;
  itemCount: number;
};

export async function getAllPayersWithUsage(): Promise<PayerWithUsage[]> {
  await requireUser();
  const rows = await queryRows<Omit<PayerWithUsage, "itemCount"> & { itemCount: string }>(
    `SELECT
       p.id AS id,
       p.name AS name,
       p.created_at AS "createdAt",
       COUNT(i.id) AS "itemCount"
     FROM payers p
     LEFT JOIN expense_items i ON i.payer_id = p.id
     GROUP BY p.id
     ORDER BY LOWER(p.name) ASC`
  );
  return rows.map((row) => ({ ...row, itemCount: Number(row.itemCount) }));
}
