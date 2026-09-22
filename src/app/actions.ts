"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, queryRow, queryRows } from "@/lib/db";
import { isRoundStatus } from "@/lib/round-status";
import { deleteReceipts } from "@/lib/storage";
import { requireRole, requireUser } from "@/features/auth/services/auth";

export type CreateRoundState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function createRound(
  _prevState: CreateRoundState,
  formData: FormData
): Promise<CreateRoundState> {
  requireRole(await requireUser(), "admin", "editor");
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อรอบ" };
  }

  const publicToken = randomBytes(20).toString("hex");
  const result = await queryRow<{ id: number }>(
    `INSERT INTO expense_rounds (name, note, public_token) VALUES ($1, $2, $3) RETURNING id`,
    [name, note || null, publicToken]
  );

  revalidatePath("/");
  redirect(`/rounds/${result!.id}`);
}

export type DeleteRoundState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function deleteRound(
  _prevState: DeleteRoundState,
  formData: FormData
): Promise<DeleteRoundState> {
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการลบ" };
  }

  const orphanedReceipts = await queryRows<{ storageKey: string }>(
    `SELECT r.storage_key AS "storageKey"
     FROM expense_item_receipts r
     JOIN expense_items i ON i.id = r.item_id
     WHERE i.round_id = $1`,
    [roundId]
  );

  const result = await query(`DELETE FROM expense_rounds WHERE id = $1`, [roundId]);
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการลบ" };
  }

  await deleteReceipts(orphanedReceipts.map((r) => r.storageKey));

  revalidatePath("/");

  // Deleting from the round's own detail page: that route no longer resolves, so send
  // the browser home via the action itself rather than a client-side redirect — a
  // client-side redirect would race the automatic RSC refresh Next.js triggers after
  // this action resolves, which re-renders the now-deleted route as a 404 first.
  if (redirectTo) {
    redirect(redirectTo);
  }

  return { status: "success" };
}

export type UpdateRoundDetailsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function updateRoundDetails(
  _prevState: UpdateRoundDetailsState,
  formData: FormData
): Promise<UpdateRoundDetailsState> {
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const name = String(formData.get("name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการแก้ไข" };
  }
  if (!name) {
    return { status: "error", message: "กรุณาระบุชื่อรอบ" };
  }
  if (!isRoundStatus(status)) {
    return { status: "error", message: "สถานะไม่ถูกต้อง" };
  }

  const result = await query(
    `UPDATE expense_rounds SET name = $1, note = $2, status = $3 WHERE id = $4`,
    [name, note || null, status, roundId]
  );
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการแก้ไข" };
  }

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  return { status: "success" };
}

export type UpdateRoundStatusState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function updateRoundStatus(
  _prevState: UpdateRoundStatusState,
  formData: FormData
): Promise<UpdateRoundStatusState> {
  requireRole(await requireUser(), "admin", "editor");
  const roundId = Number(formData.get("roundId"));
  const newStatus = String(formData.get("roundStatus") ?? "");

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการอัปเดต" };
  }
  if (!isRoundStatus(newStatus)) {
    return { status: "error", message: "สถานะไม่ถูกต้อง" };
  }

  const result = await query(`UPDATE expense_rounds SET status = $1 WHERE id = $2`, [
    newStatus,
    roundId,
  ]);
  if (result.rowCount === 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการอัปเดต" };
  }

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  return { status: "success" };
}
