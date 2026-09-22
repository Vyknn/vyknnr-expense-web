"use server";

import { redirect } from "next/navigation";
import { authenticate, isSafeInternalPath } from "@/features/auth/services/auth";
import { createSession, setSessionCookie } from "@/features/auth/services/session";

export type LoginState = { status: "idle" } | { status: "error"; message: string };

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email.trim() || !password) return { status: "error", message: "กรุณาระบุอีเมลและรหัสผ่าน" };

  const result = await authenticate(email, password);
  if (result.status === "error") return result;

  const session = await createSession(result.user.id);
  await setSessionCookie(session.token, session.expiresAt);
  redirect(result.user.mustChangePassword ? "/change-password" : isSafeInternalPath(next) ? next : "/");
}
