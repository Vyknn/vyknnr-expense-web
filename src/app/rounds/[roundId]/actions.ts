"use server";

import { revalidatePath } from "next/cache";
import { query, queryRow, queryRows, withTransaction } from "@/lib/db";
import { compressReceiptImage } from "@/lib/receipt-image";
import { deleteReceipts, uploadReceipt } from "@/lib/storage";
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
  storageKey: string;
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

async function parseExpenseFields(
  formData: FormData
): Promise<ParsedExpenseFields | { error: string }> {
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

    const category = await queryRow<{ id: number }>(
      `SELECT id FROM expense_categories WHERE id = $1`,
      [parsedCategoryId]
    );
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

async function validateAndUploadReceipts(
  files: File[],
  roundId: number
): Promise<ValidatedReceipt[] | { error: string }> {
  if (files.length > MAX_RECEIPT_COUNT) {
    return { error: `แนบไฟล์ได้ไม่เกิน ${MAX_RECEIPT_COUNT} ไฟล์ต่อรายการ` };
  }

  const receipts: ValidatedReceipt[] = [];
  for (const file of files) {
    if (file.size > MAX_RECEIPT_BYTES) {
      return { error: `ไฟล์ "${file.name}" ต้องไม่เกิน 5MB` };
    }
    if (!ALLOWED_RECEIPT_TYPES.has(file.type)) {
      return { error: "รองรับเฉพาะรูปภาพ JPG, PNG หรือ WEBP เท่านั้น" };
    }

    let image: Awaited<ReturnType<typeof compressReceiptImage>>;
    try {
      image = await compressReceiptImage(Buffer.from(await file.arrayBuffer()));
    } catch {
      return { error: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่ถูกต้องหรือไฟล์เสียหาย` };
    }

    let storageKey: string;
    try {
      storageKey = await uploadReceipt(image.buffer, image.mimeType, roundId);
    } catch (err) {
      console.error(`[expense-items] อัปโหลดไฟล์ "${file.name}" ไป Cloud Storage ไม่สำเร็จ`, err);
      return { error: "ไม่สามารถอัปโหลดไฟล์หลักฐานได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" };
    }

    receipts.push({
      storageKey,
      mimeType: image.mimeType,
      filename: toJpegFilename(file.name),
    });
  }

  return receipts;
}

async function findPayerId(payerId: string): Promise<number | null> {
  if (!payerId) return null;

  const parsedId = Number(payerId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("ผู้จ่ายที่เลือกไม่ถูกต้อง");
  }

  const payer = await queryRow<{ id: number }>(`SELECT id FROM payers WHERE id = $1`, [parsedId]);
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

  const round = await queryRow<{ id: number }>(
    `SELECT id FROM expense_rounds WHERE id = $1`,
    [roundId]
  );
  if (!round) return { status: "error", message: "ไม่พบรอบที่ระบุ" };

  const parsed = await parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, categoryId, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number | null;
  try {
    resolvedPayerId = await findPayerId(payerId);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ไม่สามารถระบุผู้จ่ายได้",
    };
  }

  const uploaded = await validateAndUploadReceipts(receiptFiles, roundId);
  if ("error" in uploaded) {
    return { status: "error", message: uploaded.error };
  }
  const receipts = uploaded;

  await withTransaction(async (tx) => {
    const item = await tx.queryRow<{ id: number }>(
      `INSERT INTO expense_items (round_id, payer_id, category_id, description, amount_satang, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [roundId, resolvedPayerId, categoryId, description, amountSatang, expenseDate]
    );
    const itemId = item!.id;

    for (const receipt of receipts) {
      await tx.query(
        `INSERT INTO expense_item_receipts (item_id, storage_key, mime_type, filename)
         VALUES ($1, $2, $3, $4)`,
        [itemId, receipt.storageKey, receipt.mimeType, receipt.filename]
      );
    }
  });

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
  const newReceiptFiles = formData
    .getAll("receipts")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const removeReceiptIds = formData
    .getAll("removeReceiptIds")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (
    !Number.isInteger(roundId) ||
    roundId <= 0 ||
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  const round = await queryRow<{ id: number }>(
    `SELECT id FROM expense_rounds WHERE id = $1`,
    [roundId]
  );
  if (!round) return { status: "error", message: "ไม่พบรอบที่ระบุ" };

  const parsed = await parseExpenseFields(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }
  const { description, categoryId, amountSatang, expenseDate } = parsed;

  let resolvedPayerId: number | null;
  try {
    resolvedPayerId = await findPayerId(payerId);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ไม่สามารถระบุผู้จ่ายได้",
    };
  }

  const uploaded = await validateAndUploadReceipts(newReceiptFiles, roundId);
  if ("error" in uploaded) {
    return { status: "error", message: uploaded.error };
  }
  const newReceipts = uploaded;

  type UpdateItemTxResult =
    | { found: false }
    | { found: true; removedStorageKeys: string[] };

  const txResult = await withTransaction(async (tx): Promise<UpdateItemTxResult> => {
    const result = await tx.query(
      `UPDATE expense_items
       SET payer_id = $1, category_id = $2, description = $3, amount_satang = $4, expense_date = $5
       WHERE id = $6 AND round_id = $7`,
      [resolvedPayerId, categoryId, description, amountSatang, expenseDate, itemId, roundId]
    );
    if (result.rowCount === 0) {
      return { found: false };
    }

    let removedStorageKeys: string[] = [];
    if (removeReceiptIds.length > 0) {
      const toRemove = await tx.queryRows<{ id: number; storageKey: string }>(
        `SELECT id, storage_key AS "storageKey"
         FROM expense_item_receipts
         WHERE item_id = $1 AND id = ANY($2::int[])`,
        [itemId, removeReceiptIds]
      );
      removedStorageKeys = toRemove.map((receipt) => receipt.storageKey);
      if (toRemove.length > 0) {
        await tx.query(
          `DELETE FROM expense_item_receipts WHERE item_id = $1 AND id = ANY($2::int[])`,
          [itemId, toRemove.map((receipt) => receipt.id)]
        );
      }
    }

    for (const receipt of newReceipts) {
      await tx.query(
        `INSERT INTO expense_item_receipts (item_id, storage_key, mime_type, filename)
         VALUES ($1, $2, $3, $4)`,
        [itemId, receipt.storageKey, receipt.mimeType, receipt.filename]
      );
    }

    return { found: true, removedStorageKeys };
  });

  if (!txResult.found) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
  }

  await deleteReceipts(txResult.removedStorageKeys);

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

  const orphanedReceipts = await queryRows<{ storageKey: string }>(
    `SELECT storage_key AS "storageKey" FROM expense_item_receipts WHERE item_id = $1`,
    [itemId]
  );

  const result = await query(`DELETE FROM expense_items WHERE id = $1 AND round_id = $2`, [
    itemId,
    roundId,
  ]);
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบรายการที่ต้องการลบ" };
  }

  await deleteReceipts(orphanedReceipts.map((r) => r.storageKey));

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  revalidatePath("/");
  return { status: "idle" };
}
