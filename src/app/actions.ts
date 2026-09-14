"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isRoundStatus } from "@/lib/round-status";
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

  const result = db
    .prepare(`INSERT INTO expense_rounds (name, note) VALUES (?, ?)`)
    .run(name, note || null);

  revalidatePath("/");
  redirect(`/rounds/${result.lastInsertRowid}`);
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

  const result = db.prepare(`DELETE FROM expense_rounds WHERE id = ?`).run(roundId);
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการลบ" };
  }

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

  const result = db.prepare(
    `UPDATE expense_rounds SET name = ?, note = ?, status = ? WHERE id = ?`
  ).run(name, note || null, status, roundId);
  if (result.changes === 0) {
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

  const result = db.prepare(`UPDATE expense_rounds SET status = ? WHERE id = ?`).run(
    newStatus,
    roundId
  );
  if (result.changes === 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการอัปเดต" };
  }

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/summary`);
  return { status: "success" };
}
