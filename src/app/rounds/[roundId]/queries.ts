import "server-only";
import { db } from "@/lib/db";
import type { RoundStatus } from "@/lib/round-status";

export type Round = {
  id: number;
  name: string;
  note: string | null;
  status: RoundStatus;
  createdAt: string;
};

export type ExpenseItem = {
  id: number;
  description: string;
  amountSatang: number;
  expenseDate: string;
  payerId: number;
  payerName: string;
};

export type Receipt = {
  id: number;
  itemId: number;
  mimeType: string;
};

export type PayerSummary = {
  payerId: number;
  payerName: string;
  totalSatang: number;
};

export type Payer = {
  id: number;
  name: string;
};

export function getRound(roundId: number): Round | undefined {
  return db
    .prepare(
      `SELECT id, name, note, status, created_at AS createdAt FROM expense_rounds WHERE id = ?`
    )
    .get(roundId) as Round | undefined;
}

export function getExpenseItems(roundId: number): ExpenseItem[] {
  return db
    .prepare(
      `SELECT
         i.id AS id,
         i.description AS description,
         i.amount_satang AS amountSatang,
         i.expense_date AS expenseDate,
         i.payer_id AS payerId,
         p.name AS payerName
       FROM expense_items i
       JOIN payers p ON p.id = i.payer_id
       WHERE i.round_id = ?
       ORDER BY i.expense_date DESC, i.id DESC`
    )
    .all(roundId) as ExpenseItem[];
}

/** All receipts for every item in a round, in one query — avoids N+1 per-item lookups. */
export function getReceiptsForRound(roundId: number): Receipt[] {
  return db
    .prepare(
      `SELECT r.id AS id, r.item_id AS itemId, r.mime_type AS mimeType
       FROM expense_item_receipts r
       JOIN expense_items i ON i.id = r.item_id
       WHERE i.round_id = ?
       ORDER BY r.id ASC`
    )
    .all(roundId) as Receipt[];
}

export function getPayerSummary(roundId: number): PayerSummary[] {
  return db
    .prepare(
      `SELECT
         p.id AS payerId,
         p.name AS payerName,
         SUM(i.amount_satang) AS totalSatang
       FROM expense_items i
       JOIN payers p ON p.id = i.payer_id
       WHERE i.round_id = ?
       GROUP BY p.id
       ORDER BY totalSatang DESC`
    )
    .all(roundId) as PayerSummary[];
}

export function getAllPayers(): Payer[] {
  return db.prepare(`SELECT id, name FROM payers ORDER BY name ASC`).all() as Payer[];
}
