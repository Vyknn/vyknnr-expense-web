"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/features/auth/services/auth";

export type SettingsActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export type PayerActionState = SettingsActionState;
export type ExpenseCategoryActionState = SettingsActionState;

function parseEntityId(formData: FormData, fieldName: string): number | null {
  const id = Number(formData.get(fieldName));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseName(formData: FormData): string | null {
  const name = String(formData.get("name") ?? "").trim();
  return name || null;
}

function parsePayerId(formData: FormData): number | null {
  return parseEntityId(formData, "payerId");
}

function parsePayerName(formData: FormData): string | null {
  return parseName(formData);
}

function parseExpenseCategoryId(formData: FormData): number | null {
  return parseEntityId(formData, "categoryId");
}

function parseExpenseCategoryName(formData: FormData): string | null {
  return parseName(formData);
}

function entityNameExists(
  table: "payers" | "expense_categories",
  name: string,
  excludedEntityId?: number
): boolean {
  const entity = db
    .prepare(
      `SELECT id
       FROM ${table}
       WHERE name = ? COLLATE NOCASE
         AND (? IS NULL OR id != ?)`
    )
    .get(name, excludedEntityId ?? null, excludedEntityId ?? null) as
    | { id: number }
    | undefined;

  return Boolean(entity);
}

function payerNameExists(name: string, excludedPayerId?: number): boolean {
  return entityNameExists("payers", name, excludedPayerId);
}

function expenseCategoryNameExists(
  name: string,
  excludedCategoryId?: number
): boolean {
  return entityNameExists("expense_categories", name, excludedCategoryId);
}

function revalidatePayerRoutes() {
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/rounds/[roundId]", "page");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

export async function createPayer(
  _prevState: PayerActionState,
  formData: FormData
): Promise<PayerActionState> {
  requireRole(await requireUser(), "admin");
  const name = parsePayerName(formData);
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อผู้จ่าย/ผู้สำรอง" };
  }
  if (payerNameExists(name)) {
    return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
  }

  try {
    db.prepare(`INSERT INTO payers (name) VALUES (?)`).run(name);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
    }
    throw error;
  }

  revalidatePayerRoutes();
  return { status: "success" };
}

export async function updatePayer(
  _prevState: PayerActionState,
  formData: FormData
): Promise<PayerActionState> {
  requireRole(await requireUser(), "admin");
  const payerId = parsePayerId(formData);
  const name = parsePayerName(formData);

  if (!payerId) {
    return { status: "error", message: "ไม่พบผู้จ่าย/ผู้สำรองที่ต้องการแก้ไข" };
  }
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อผู้จ่าย/ผู้สำรอง" };
  }
  if (payerNameExists(name, payerId)) {
    return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
  }

  try {
    const result = db
      .prepare(`UPDATE payers SET name = ? WHERE id = ?`)
      .run(name, payerId);
    if (result.changes === 0) {
      return { status: "error", message: "ไม่พบผู้จ่าย/ผู้สำรองที่ต้องการแก้ไข" };
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
    }
    throw error;
  }

  revalidatePayerRoutes();
  return { status: "success" };
}

export async function deletePayer(
  _prevState: PayerActionState,
  formData: FormData
): Promise<PayerActionState> {
  requireRole(await requireUser(), "admin");
  const payerId = parsePayerId(formData);
  if (!payerId) {
    return { status: "error", message: "ไม่พบผู้จ่าย/ผู้สำรองที่ต้องการลบ" };
  }

  const result = db.prepare(`DELETE FROM payers WHERE id = ?`).run(payerId);
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบผู้จ่าย/ผู้สำรองที่ต้องการลบ" };
  }

  revalidatePayerRoutes();
  return { status: "success" };
}

export async function createExpenseCategory(
  _prevState: ExpenseCategoryActionState,
  formData: FormData
): Promise<ExpenseCategoryActionState> {
  requireRole(await requireUser(), "admin");
  const name = parseExpenseCategoryName(formData);
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อประเภทค่าใช้จ่าย" };
  }
  if (expenseCategoryNameExists(name)) {
    return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
  }

  try {
    db.prepare(`INSERT INTO expense_categories (name) VALUES (?)`).run(name);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
    }
    throw error;
  }

  revalidatePayerRoutes();
  return { status: "success" };
}

export async function updateExpenseCategory(
  _prevState: ExpenseCategoryActionState,
  formData: FormData
): Promise<ExpenseCategoryActionState> {
  requireRole(await requireUser(), "admin");
  const categoryId = parseExpenseCategoryId(formData);
  const name = parseExpenseCategoryName(formData);

  if (!categoryId) {
    return { status: "error", message: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการแก้ไข" };
  }
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อประเภทค่าใช้จ่าย" };
  }
  if (expenseCategoryNameExists(name, categoryId)) {
    return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
  }

  try {
    const result = db
      .prepare(`UPDATE expense_categories SET name = ? WHERE id = ?`)
      .run(name, categoryId);
    if (result.changes === 0) {
      return { status: "error", message: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการแก้ไข" };
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
    }
    throw error;
  }

  revalidatePayerRoutes();
  return { status: "success" };
}

export async function deleteExpenseCategory(
  _prevState: ExpenseCategoryActionState,
  formData: FormData
): Promise<ExpenseCategoryActionState> {
  requireRole(await requireUser(), "admin");
  const categoryId = parseExpenseCategoryId(formData);
  if (!categoryId) {
    return { status: "error", message: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการลบ" };
  }

  const result = db
    .prepare(`DELETE FROM expense_categories WHERE id = ?`)
    .run(categoryId);
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการลบ" };
  }

  revalidatePayerRoutes();
  return { status: "success" };
}
