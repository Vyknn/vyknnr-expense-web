import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/features/auth/constants";

export { SESSION_COOKIE_NAME } from "@/features/auth/constants";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare(`DELETE FROM sessions WHERE julianday(expires_at) <= julianday('now')`).run();
  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)`
  ).run(userId, hashSessionToken(token), expiresAt);

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

export function revokeSessionToken(token: string) {
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashSessionToken(token));
}

export function revokeUserSessions(userId: number, exceptToken?: string) {
  if (exceptToken) {
    db.prepare(`DELETE FROM sessions WHERE user_id = ? AND token_hash != ?`).run(
      userId,
      hashSessionToken(exceptToken)
    );
    return;
  }

  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}
