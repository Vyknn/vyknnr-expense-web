import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";

export type ExpenseCategoryWithUsage = {
  id: number;
  name: string;
  createdAt: string;
  itemCount: number;
};

export async function getAllExpenseCategoriesWithUsage(): Promise<ExpenseCategoryWithUsage[]> {
  await requireUser();
  return db
    .prepare(
      `SELECT
         c.id AS id,
         c.name AS name,
         c.created_at AS createdAt,
         COUNT(i.id) AS itemCount
       FROM expense_categories c
       LEFT JOIN expense_items i ON i.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name COLLATE NOCASE ASC`
    )
    .all() as ExpenseCategoryWithUsage[];
}
