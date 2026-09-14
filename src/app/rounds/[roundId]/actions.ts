"use server";

import { revalidatePath } from "next/cache";
import {
  isExpenseCategory,
  type ExpenseCategory,
} from "@/lib/expense-category";
import { db } from "@/lib/db";

export type AddExpenseItemState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_COUNT = 10;
const ALLOWED_RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type ValidatedReceipt = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

type ParsedExpenseFields = {
  description: string;
  category: ExpenseCategory;
  amountSatang: number;
  expenseDate: string;
};

function parseExpenseFields(
  formData: FormData
): ParsedExpenseFields | { error: string } {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amountBaht = String(formData.get("amount") ?? "").trim();
  const expenseDate = String(formData.get("expenseDate") ?? "").trim();

  if (!description) {
    return { error: "กรุณาระบุรายละเอียดค่าใช้จ่าย" };
  }
  if (!expenseDate) {
    return { error: "กรุณาระบุวันที่จ่าย" };
  }
  if (!isExpenseCategory(category)) {
    return { error: "กรุณาเลือกประเภทค่าใช้จ่าย" };
  }

  const amountSatang = Math.round(Number(amountBaht) * 100);
  if (!Number.isFinite(amountSatang) || amountSatang <= 0) {
    return { error: "จำนวนเงินต้องมากกว่า 0" };
  }

  return { description, category, amountSatang, expenseDate };
}

function findOrCreatePayerId(payerId: string, newPayerName: string): number {
  const trimmedNewName = newPayerName.trim();

  if (trimmedNewName) {
    const existing = db
      .prepare(`SELECT id FROM payers WHERE name = ? COLLATE NOCASE`)
      .get(trimmedNewName) as { id: number } | undefined;
    if (existing) return existing.id;

    const inserted = db
      .prepare(`INSERT INTO payers (name) VALUES (?)`)
      .run(trimmedNewName);
    return Number(inserted.lastInsertRowid);
  }

  const parsedId = Number(payerId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("กรุณาเลือกผู้จ่าย หรือพิมพ์ชื่อผู้จ่ายใหม่");
  }
  return parsedId;
}

export async function addExpenseItem(
  _prevState: AddExpenseItemState,
  formData: FormData
): Promise<AddExpenseItemState> {
  const roundId = Number(formData.get("roundId"));
  const payerId = String(formData.get("payerId") ?? "");
  const newPayerName = String(formData.get("newPayerName") ?? "");
  const receiptFiles = formData
    .getAll("receipts")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ระบุ" };
  }

  const parsed = parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, category, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number;
  try {
    resolvedPayerId = findOrCreatePayerId(payerId, newPayerName);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ไม่สามารถระบุผู้จ่ายได้",
    };
  }

  if (receiptFiles.length > MAX_RECEIPT_COUNT) {
    return {
      status: "error",
      message: `แนบไฟล์ได้ไม่เกิน ${MAX_RECEIPT_COUNT} ไฟล์ต่อรายการ`,
    };
  }

  const receipts: ValidatedReceipt[] = [];
  for (const file of receiptFiles) {
    if (file.size > MAX_RECEIPT_BYTES) {
      return { status: "error", message: `ไฟล์ "${file.name}" ต้องไม่เกิน 5MB` };
    }
    if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
      return {
        status: "error",
        message: "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น",
      };
    }
    receipts.push({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      filename: file.name,
    });
  }

  const insertItemWithReceipts = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO expense_items (round_id, payer_id, description, category, amount_satang, expense_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        roundId,
        resolvedPayerId,
        description,
        category,
        amountSatang,
        expenseDate
      );

    const itemId = Number(result.lastInsertRowid);
    const insertReceipt = db.prepare(
      `INSERT INTO expense_item_receipts (item_id, blob, mime_type, filename)
       VALUES (?, ?, ?, ?)`
    );
    for (const receipt of receipts) {
      insertReceipt.run(itemId, receipt.buffer, receipt.mimeType, receipt.filename);
    }
  });

  insertItemWithReceipts();

  revalidatePath(`/rounds/${roundId}`);
  return { status: "success" };
}

export type UpdateExpenseItemState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function updateExpenseItem(
  _prevState: UpdateExpenseItemState,
  formData: FormData
): Promise<UpdateExpenseItemState> {
  const roundId = Number(formData.get("roundId"));
  const itemId = Number(formData.get("itemId"));
  const payerId = String(formData.get("payerId") ?? "");
  const newPayerName = String(formData.get("newPayerName") ?? "");

  if (
    !Number.isInteger(roundId) ||
    roundId <= 0 ||
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  const parsed = parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, category, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number;
  try {
    resolvedPayerId = findOrCreatePayerId(payerId, newPayerName);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ไม่สามารถระบุผู้จ่ายได้",
    };
  }

  db.prepare(
    `UPDATE expense_items
     SET payer_id = ?, description = ?, category = ?, amount_satang = ?, expense_date = ?
     WHERE id = ? AND round_id = ?`
  ).run(
    resolvedPayerId,
    description,
    category,
    amountSatang,
    expenseDate,
    itemId,
    roundId
  );

  revalidatePath(`/rounds/${roundId}`);
  return { status: "success" };
}

export type DeleteExpenseItemState = { status: "idle" } | { status: "error"; message: string };

export async function deleteExpenseItem(
  _prevState: DeleteExpenseItemState,
  formData: FormData
): Promise<DeleteExpenseItemState> {
  const roundId = Number(formData.get("roundId"));
  const itemId = Number(formData.get("itemId"));

  if (!Number.isInteger(roundId) || !Number.isInteger(itemId)) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการลบ" };
  }

  db.prepare(`DELETE FROM expense_items WHERE id = ? AND round_id = ?`).run(
    itemId,
    roundId
  );

  revalidatePath(`/rounds/${roundId}`);
  return { status: "idle" };
}
