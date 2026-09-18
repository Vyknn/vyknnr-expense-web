"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
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

function payerNameExists(name: string, excludedPayerId?: number): boolean {
  const payer = db
    .prepare(
      `SELECT id
       FROM payers
       WHERE name = ? COLLATE NOCASE
         AND (? IS NULL OR id != ?)`
    )
    .get(name, excludedPayerId ?? null, excludedPayerId ?? null) as
    | { id: number }
    | undefined;

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
