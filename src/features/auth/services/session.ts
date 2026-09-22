import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { query, type Executor } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";

export { SESSION_COOKIE_NAME } from "@/features/auth/constants";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number, executor: Executor = { query }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await executor.query(`DELETE FROM sessions WHERE expires_at <= now()`);
  await executor.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hashSessionToken(token), expiresAt]
  );

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function revokeSessionToken(token: string, executor: Executor = { query }) {
  await executor.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashSessionToken(token)]);
}

export async function revokeUserSessions(
  userId: number,
  exceptToken?: string,
  executor: Executor = { query }
) {
  if (exceptToken) {
    await executor.query(`DELETE FROM sessions WHERE user_id = $1 AND token_hash != $2`, [
      userId,
      hashSessionToken(exceptToken),
    ]);
    return;
  }

  await executor.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
