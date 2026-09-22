import "server-only";
import { queryRows, queryRow } from "@/lib/db";
import type { RoundStatus } from "@/lib/round-status";
import { requireUser } from "@/features/auth/services/auth";

export type Round = {
  id: number;
  name: string;
  note: string | null;
  status: RoundStatus;
  publicToken: string;
  createdAt: string;
};

export type ExpenseItem = {
  id: number;
  description: string;
  categoryId: number | null;
  categoryName: string | null;
  amountSatang: number;
  expenseDate: string;
  payerId: number | null;
  payerName: string | null;
};

export type Receipt = {
  id: number;
  itemId: number;
  mimeType: string;
};

export type PayerSummary = {
  payerId: number | null;
  payerName: string | null;
  totalSatang: number;
};

export type Payer = {
  id: number;
  name: string;
};

export type ExpenseCategory = {
  id: number;
  name: string;
};

export async function getRound(roundId: number): Promise<Round | undefined> {
  await requireUser();
  return queryRow<Round>(
    `SELECT id, name, note, status, public_token AS "publicToken", created_at AS "createdAt"
     FROM expense_rounds WHERE id = $1`,
    [roundId]
  );
}

export async function getExpenseItems(roundId: number): Promise<ExpenseItem[]> {
  await requireUser();
  return queryRows<ExpenseItem>(
    `SELECT
       i.id AS id,
       i.description AS description,
       i.category_id AS "categoryId",
       c.name AS "categoryName",
       i.amount_satang AS "amountSatang",
       i.expense_date AS "expenseDate",
       i.payer_id AS "payerId",
       p.name AS "payerName"
     FROM expense_items i
     LEFT JOIN payers p ON p.id = i.payer_id
     LEFT JOIN expense_categories c ON c.id = i.category_id
     WHERE i.round_id = $1
     ORDER BY i.expense_date DESC, i.id DESC`,
    [roundId]
  );
}

/** All receipts for every item in a round, in one query — avoids N+1 per-item lookups. */
export async function getReceiptsForRound(roundId: number): Promise<Receipt[]> {
  await requireUser();
  return queryRows<Receipt>(
    `SELECT r.id AS id, r.item_id AS "itemId", r.mime_type AS "mimeType"
     FROM expense_item_receipts r
     JOIN expense_items i ON i.id = r.item_id
     WHERE i.round_id = $1
     ORDER BY r.id ASC`,
    [roundId]
  );
}

export async function getPayerSummary(roundId: number): Promise<PayerSummary[]> {
  await requireUser();
  const rows = await queryRows<{ payerId: number | null; payerName: string | null; totalSatang: string }>(
    `SELECT
       i.payer_id AS "payerId",
       p.name AS "payerName",
       SUM(i.amount_satang) AS "totalSatang"
     FROM expense_items i
     LEFT JOIN payers p ON p.id = i.payer_id
     WHERE i.round_id = $1
     GROUP BY i.payer_id, p.name
     ORDER BY SUM(i.amount_satang) DESC`,
    [roundId]
  );
  return rows.map((row) => ({ ...row, totalSatang: Number(row.totalSatang) }));
}

export async function getAllPayers(): Promise<Payer[]> {
  await requireUser();
  return queryRows<Payer>(`SELECT id, name FROM payers ORDER BY name ASC`);
}

export async function getAllExpenseCategories(): Promise<ExpenseCategory[]> {
  await requireUser();
  return queryRows<ExpenseCategory>(
    `SELECT id, name FROM expense_categories ORDER BY LOWER(name) ASC`
  );
}
