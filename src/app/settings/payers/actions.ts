"use server";

import { revalidatePath } from "next/cache";
import { query, queryRow } from "@/lib/db";
import { requireRole, requireUser } from "@/features/auth/services/auth";

export type PayerActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function parsePayerId(formData: FormData): number | null {
  const id = Number(formData.get("payerId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parsePayerName(formData: FormData): string | null {
  const name = String(formData.get("name") ?? "").trim();
  return name || null;
}

async function payerNameExists(name: string, excludedPayerId?: number): Promise<boolean> {
  const payer = await queryRow<{ id: number }>(
    `SELECT id
     FROM payers
     WHERE LOWER(name) = LOWER($1)
       AND ($2::int IS NULL OR id != $2)`,
    [name, excludedPayerId ?? null]
  );

  return Boolean(payer);
}

function revalidatePayerRoutes() {
  revalidatePath("/settings/payers");
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

export async function createPayer(
  _prevState: PayerActionState,
  formData: FormData
): Promise<PayerActionState> {
  requireRole(await requireUser(), "admin");
  const name = parsePayerName(formData);
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อผู้จ่าย/ผู้สำรอง" };
  }
  if (await payerNameExists(name)) {
    return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
  }

  try {
    await query(`INSERT INTO payers (name) VALUES ($1)`, [name]);
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
  if (await payerNameExists(name, payerId)) {
    return { status: "error", message: "มีชื่อผู้จ่าย/ผู้สำรองนี้แล้ว" };
  }

  try {
    const result = await query(`UPDATE payers SET name = $1 WHERE id = $2`, [name, payerId]);
    if (result.rowCount === 0) {
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

  const result = await query(`DELETE FROM payers WHERE id = $1`, [payerId]);
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบผู้จ่าย/ผู้สำรองที่ต้องการลบ" };
  }

  revalidatePayerRoutes();
  return { status: "success" };
}
