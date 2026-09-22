import "server-only";
import { queryRow, queryRows } from "@/lib/db";
import type { RoundStatus } from "@/lib/round-status";

// ไม่มี requireUser() ในไฟล์นี้เลยโดยตั้งใจ — หน้านี้เข้าถึงด้วย share token ใน URL แทน session
// ดู src/app/rounds/[roundId]/queries.ts สำหรับ query ชุดเดียวกันฝั่ง authenticated

export type PublicRound = {
  id: number;
  name: string;
  note: string | null;
  status: RoundStatus;
  createdAt: string;
};

export type PublicExpenseItem = {
  id: number;
  description: string;
  categoryName: string | null;
  amountSatang: number;
  expenseDate: string;
  payerName: string | null;
};

export type PublicReceipt = {
  id: number;
  itemId: number;
  mimeType: string;
};

export type PublicPayerSummary = {
  payerName: string | null;
  totalSatang: number;
};

export async function getPublicRound(token: string): Promise<PublicRound | undefined> {
  return queryRow<PublicRound>(
    `SELECT id, name, note, status, created_at AS "createdAt"
     FROM expense_rounds WHERE public_token = $1`,
    [token]
  );
}

export async function getPublicExpenseItems(roundId: number): Promise<PublicExpenseItem[]> {
  return queryRows<PublicExpenseItem>(
    `SELECT
       i.id AS id,
       i.description AS description,
       c.name AS "categoryName",
       i.amount_satang AS "amountSatang",
       i.expense_date AS "expenseDate",
       p.name AS "payerName"
     FROM expense_items i
     LEFT JOIN payers p ON p.id = i.payer_id
     LEFT JOIN expense_categories c ON c.id = i.category_id
     WHERE i.round_id = $1
     ORDER BY i.expense_date ASC, i.id ASC`,
    [roundId]
  );
}

export async function getPublicReceiptsForRound(roundId: number): Promise<PublicReceipt[]> {
  return queryRows<PublicReceipt>(
    `SELECT r.id AS id, r.item_id AS "itemId", r.mime_type AS "mimeType"
     FROM expense_item_receipts r
     JOIN expense_items i ON i.id = r.item_id
     WHERE i.round_id = $1
     ORDER BY r.id ASC`,
    [roundId]
  );
}

export async function getPublicPayerSummary(roundId: number): Promise<PublicPayerSummary[]> {
  const rows = await queryRows<{ payerName: string | null; totalSatang: string }>(
    `SELECT p.name AS "payerName", SUM(i.amount_satang) AS "totalSatang"
     FROM expense_items i
     LEFT JOIN payers p ON p.id = i.payer_id
     WHERE i.round_id = $1
     GROUP BY i.payer_id, p.name
     ORDER BY SUM(i.amount_satang) DESC`,
    [roundId]
  );
  return rows.map((row) => ({ ...row, totalSatang: Number(row.totalSatang) }));
}
