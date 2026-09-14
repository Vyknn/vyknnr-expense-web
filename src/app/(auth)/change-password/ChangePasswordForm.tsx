"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">รหัสผ่านปัจจุบัน<input name="currentPassword" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" /></label>
      <label className="block text-sm font-medium">รหัสผ่านใหม่<input name="password" type="password" autoComplete="new-password" minLength={12} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" /></label>
      <label className="block text-sm font-medium">ยืนยันรหัสผ่านใหม่<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" /></label>
      {state.status === "error" && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">{pending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}</button>
    </form>
  );
}
