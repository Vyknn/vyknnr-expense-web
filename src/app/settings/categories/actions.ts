"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/features/auth/services/auth";

export type ExpenseCategoryActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function parseExpenseCategoryId(formData: FormData): number | null {
  const id = Number(formData.get("categoryId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseExpenseCategoryName(formData: FormData): string | null {
  const name = String(formData.get("name") ?? "").trim();
  return name || null;
}

function expenseCategoryNameExists(name: string, excludedCategoryId?: number): boolean {
  const category = db
    .prepare(
      `SELECT id
       FROM expense_categories
       WHERE name = ? COLLATE NOCASE
         AND (? IS NULL OR id != ?)`
    )
    .get(name, excludedCategoryId ?? null, excludedCategoryId ?? null) as
    | { id: number }
    | undefined;

  return Boolean(category);
}

function revalidateExpenseCategoryRoutes() {
  revalidatePath("/settings/categories");
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

  revalidateExpenseCategoryRoutes();
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

  revalidateExpenseCategoryRoutes();
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

  revalidateExpenseCategoryRoutes();
  return { status: "success" };
}
