import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { queryRow, query } from "@/lib/db";
import type { Role } from "@/types/role";
import { verifyPassword } from "./password";
import { getSessionToken, hashSessionToken } from "./session";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export type CurrentUser = {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  mustChangePassword: boolean;
};

type UserCredential = CurrentUser & {
  passwordHash: string;
  isActive: number;
  failedLoginAttempts: number;
  lockedUntil: string | null;
};

async function getUserByEmail(email: string) {
  return queryRow<UserCredential>(
    `SELECT
       id,
       email,
       display_name AS "displayName",
       password_hash AS "passwordHash",
       role,
       must_change_password AS "mustChangePassword",
       is_active AS "isActive",
       failed_login_attempts AS "failedLoginAttempts",
       locked_until AS "lockedUntil"
     FROM users
     WHERE email = $1`,
    [email]
  );
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  const user = await queryRow<CurrentUser>(
    `SELECT
       u.id AS id,
       u.email AS email,
       u.display_name AS "displayName",
       u.role AS role,
       u.must_change_password AS "mustChangePassword"
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > now()
       AND u.is_active = 1`,
    [hashSessionToken(token)]
  );

  if (!user) return null;
  return { ...user, mustChangePassword: Boolean(user.mustChangePassword) };
});

export async function requireUser(options?: { allowPasswordChange?: boolean }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !options?.allowPasswordChange) {
    redirect("/change-password");
  }
  return user;
}

export function requireRole(user: CurrentUser, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
}

export async function authenticate(
  emailInput: string,
  password: string
): Promise<{ status: "success"; user: CurrentUser } | { status: "error"; message: string }> {
  const email = emailInput.trim().toLowerCase();
  const user = await getUserByEmail(email);
  const invalidCredentials = { status: "error" as const, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };

  if (!user || !user.isActive) return invalidCredentials;

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    return {
      status: "error",
      message: "บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง",
    };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
        : null;

    await query(
      `UPDATE users
       SET failed_login_attempts = $1, locked_until = $2, updated_at = now()
       WHERE id = $3`,
      [attempts, lockedUntil, user.id]
    );

    return lockedUntil
      ? { status: "error", message: "บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่อีกครั้งภายหลัง" }
      : invalidCredentials;
  }

  await query(
    `UPDATE users
     SET failed_login_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE id = $1`,
    [user.id]
  );

  return {
    status: "success",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      mustChangePassword: Boolean(user.mustChangePassword),
    },
  };
}

export function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login");
}
