"use server";

import { revalidatePath } from "next/cache";
import { query, queryRow } from "@/lib/db";
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

async function expenseCategoryNameExists(
  name: string,
  excludedCategoryId?: number
): Promise<boolean> {
  const category = await queryRow<{ id: number }>(
    `SELECT id
     FROM expense_categories
     WHERE LOWER(name) = LOWER($1)
       AND ($2::int IS NULL OR id != $2)`,
    [name, excludedCategoryId ?? null]
  );

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
    error.code === "23505"
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
  if (await expenseCategoryNameExists(name)) {
    return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
  }

  try {
    await query(`INSERT INTO expense_categories (name) VALUES ($1)`, [name]);
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
  if (await expenseCategoryNameExists(name, categoryId)) {
    return { status: "error", message: "มีประเภทค่าใช้จ่ายนี้แล้ว" };
  }

  try {
    const result = await query(`UPDATE expense_categories SET name = $1 WHERE id = $2`, [
      name,
      categoryId,
    ]);
    if (result.rowCount === 0) {
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

  const result = await query(`DELETE FROM expense_categories WHERE id = $1`, [categoryId]);
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการลบ" };
  }

  revalidateExpenseCategoryRoutes();
  return { status: "success" };
}
