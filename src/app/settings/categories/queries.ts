import "server-only";
import { queryRows } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";

export type ExpenseCategoryWithUsage = {
  id: number;
  name: string;
  createdAt: string;
  itemCount: number;
};

export async function getAllExpenseCategoriesWithUsage(): Promise<ExpenseCategoryWithUsage[]> {
  await requireUser();
  const rows = await queryRows<
    Omit<ExpenseCategoryWithUsage, "itemCount"> & { itemCount: string }
  >(
    `SELECT
       c.id AS id,
       c.name AS name,
       c.created_at AS "createdAt",
       COUNT(i.id) AS "itemCount"
     FROM expense_categories c
     LEFT JOIN expense_items i ON i.category_id = c.id
     GROUP BY c.id
     ORDER BY LOWER(c.name) ASC`
  );
  return rows.map((row) => ({ ...row, itemCount: Number(row.itemCount) }));
}
