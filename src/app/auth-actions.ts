"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, getSessionToken, revokeSessionToken } from "@/features/auth/services/session";

export async function logout() {
  const token = await getSessionToken();
  if (token) revokeSessionToken(token);
  await clearSessionCookie();
  redirect("/login");
}
