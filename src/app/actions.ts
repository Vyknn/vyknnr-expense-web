"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isRoundStatus } from "@/lib/round-status";

export type CreateRoundState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function createRound(
  _prevState: CreateRoundState,
  formData: FormData
): Promise<CreateRoundState> {
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
  const roundId = Number(formData.get("roundId"));
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการลบ" };
  }

  db.prepare(`DELETE FROM expense_rounds WHERE id = ?`).run(roundId);

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

export type UpdateRoundStatusState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function updateRoundStatus(
  _prevState: UpdateRoundStatusState,
  formData: FormData
): Promise<UpdateRoundStatusState> {
  const roundId = Number(formData.get("roundId"));
  const newStatus = String(formData.get("roundStatus") ?? "");

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return { status: "error", message: "ไม่พบรอบที่ต้องการอัปเดต" };
  }
  if (!isRoundStatus(newStatus)) {
    return { status: "error", message: "สถานะไม่ถูกต้อง" };
  }

  db.prepare(`UPDATE expense_rounds SET status = ? WHERE id = ?`).run(
    newStatus,
    roundId
  );

  revalidatePath("/");
  revalidatePath(`/rounds/${roundId}`);
  return { status: "success" };
}
