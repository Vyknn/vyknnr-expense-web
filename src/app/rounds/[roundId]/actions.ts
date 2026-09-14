"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { compressReceiptImage } from "@/lib/receipt-image";
import { requireRole, requireUser } from "@/features/auth/services/auth";

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
]);

type ValidatedReceipt = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

type ParsedExpenseFields = {
  description: string;
  categoryId: number | null;
  amountSatang: number;
  expenseDate: string;
};

function toJpegFilename(filename: string): string {
  const stem = filename.replace(/\.[^/.]+$/, "").trim() || "receipt";
  return `${stem}.jpg`;
}

function parseExpenseFields(
  formData: FormData
): ParsedExpenseFields | { error: string } {
  const description = String(formData.get("description") ?? "").trim();
  const categoryIdValue = String(formData.get("categoryId") ?? "").trim();
  const amountBaht = String(formData.get("amount") ?? "").trim();
  const expenseDate = String(formData.get("expenseDate") ?? "").trim();

  if (!description) {
    return { error: "กรุณาระบุรายละเอียดค่าใช้จ่าย" };
  }
  if (!expenseDate) {
    return { error: "กรุณาระบุวันที่จ่าย" };
  }
  let categoryId: number | null = null;
  if (categoryIdValue) {
    const parsedCategoryId = Number(categoryIdValue);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return { error: "ประเภทค่าใช้จ่ายที่เลือกไม่ถูกต้อง" };
    }

    const category = db
      .prepare(`SELECT id FROM expense_categories WHERE id = ?`)
      .get(parsedCategoryId) as { id: number } | undefined;
    if (!category) {
      return { error: "ไม่พบประเภทค่าใช้จ่ายที่เลือก" };
    }
    categoryId = category.id;
  }

  const amountSatang = Math.round(Number(amountBaht) * 100);
  if (!Number.isFinite(amountSatang) || amountSatang <= 0) {
    return { error: "จำนวนเงินต้องมากกว่า 0" };
  }

  return { description, categoryId, amountSatang, expenseDate };
}

function findPayerId(payerId: string): number | null {
  if (!payerId) return null;

  const parsedId = Number(payerId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("ผู้จ่ายที่เลือกไม่ถูกต้อง");
  }

  const payer = db
    .prepare(`SELECT id FROM payers WHERE id = ?`)
    .get(parsedId) as { id: number } | undefined;
  if (!payer) {
    throw new Error("ไม่พบผู้จ่ายที่เลือก");
  }

  return payer.id;
}

export async function addExpenseItem(
  _prevState: AddExpenseItemState,
  formData: FormData
): Promise<AddExpenseItemState> {
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const payerId = String(formData.get("payerId") ?? "");
  const receiptFiles = formData
    .getAll("receipts")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ระบุ" };
  }

  const round = db
    .prepare(`SELECT id FROM expense_rounds WHERE id = ?`)
    .get(roundId) as { id: number } | undefined;
  if (!round) return { status: "error", message: "ไม่พบรอบที่ระบุ" };

  const parsed = parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, categoryId, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number | null;
  try {
    resolvedPayerId = findPayerId(payerId);
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
        message: "รองรับเฉพาะรูปภาพ JPG, PNG หรือ WEBP เท่านั้น",
      };
    }

    try {
      const image = await compressReceiptImage(
        Buffer.from(await file.arrayBuffer())
      );
      receipts.push({
        buffer: image.buffer,
        mimeType: image.mimeType,
        filename: toJpegFilename(file.name),
      });
    } catch {
      return {
        status: "error",
        message: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่ถูกต้องหรือไฟล์เสียหาย`,
      };
    }
  }

  const insertItemWithReceipts = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO expense_items (round_id, payer_id, category_id, description, amount_satang, expense_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        roundId,
        resolvedPayerId,
        categoryId,
        description,
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
  revalidatePath(`/rounds/${roundId}/summary`);
  revalidatePath("/");
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
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const itemId = Number(formData.get("itemId"));
  const payerId = String(formData.get("payerId") ?? "");

  if (
    !Number.isInteger(roundId) ||
    roundId <= 0 ||
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  const round = db
    .prepare(`SELECT id FROM expense_rounds WHERE id = ?`)
    .get(roundId) as { id: number } | undefined;
  if (!round) return { status: "error", message: "ไม่พบรอบที่ระบุ" };

  const parsed = parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, categoryId, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number | null;
  try {
    resolvedPayerId = findPayerId(payerId);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ไม่สามารถระบุผู้จ่ายได้",
    };
  }

  const result = db.prepare(
    `UPDATE expense_items
     SET payer_id = ?, category_id = ?, description = ?, amount_satang = ?, expense_date = ?
     WHERE id = ? AND round_id = ?`
  ).run(
    resolvedPayerId,
    categoryId,
    description,
    amountSatang,
    expenseDate,
    itemId,
    roundId
  );
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  revalidatePath("/");
  return { status: "success" };
}

export type DeleteExpenseItemState = { status: "idle" } | { status: "error"; message: string };

export async function deleteExpenseItem(
  _prevState: DeleteExpenseItemState,
  formData: FormData
): Promise<DeleteExpenseItemState> {
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const itemId = Number(formData.get("itemId"));

  if (!Number.isInteger(roundId) || !Number.isInteger(itemId)) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการลบ" };
  }

  const result = db.prepare(
    `DELETE FROM expense_items WHERE id = ? AND round_id = ?`
  ).run(itemId, roundId);
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการลบ" };
  }

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  revalidatePath("/");
  return { status: "idle" };
}
