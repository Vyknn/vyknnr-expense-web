"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";
import { hashPassword, verifyPassword } from "@/features/auth/services/password";
import {
  createSession,
  revokeUserSessions,
  setSessionCookie,
} from "@/features/auth/services/session";

export type ChangePasswordState = { status: "idle" } | { status: "error"; message: string };

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireUser({ allowPasswordChange: true });
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !password || !confirmPassword) return { status: "error", message: "กรุณากรอกข้อมูลให้ครบ" };
  if (password.length < 12) return { status: "error", message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษร" };
  if (password !== confirmPassword) return { status: "error", message: "ยืนยันรหัสผ่านใหม่ไม่ตรงกัน" };

  const credential = db.prepare(`SELECT password_hash AS passwordHash FROM users WHERE id = ?`).get(user.id) as { passwordHash: string } | undefined;
  if (!credential || !verifyPassword(currentPassword, credential.passwordHash)) {
    return { status: "error", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const session = db.transaction(() => {
    db.prepare(
      `UPDATE users
       SET password_hash = ?, must_change_password = 0, failed_login_attempts = 0,
           locked_until = NULL, updated_at = datetime('now')
       WHERE id = ?`
    ).run(hashPassword(password), user.id);

    revokeUserSessions(user.id);
    return createSession(user.id);
  })();

  await setSessionCookie(session.token, session.expiresAt);
  redirect("/");
}
