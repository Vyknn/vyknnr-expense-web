"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Modal } from "@/components/modal/Modal";
import { ROLES, ROLE_LABELS } from "@/types/role";
import { createMember, type MemberActionState } from "./actions";

const initialState: MemberActionState = { status: "idle" };
const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function CreateMemberModal() {
  const [open, setOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createMember,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      // useActionState preserves the previous result until another submission.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuccess(true);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTemporaryPassword(null);
          setShowSuccess(false);
          setOpen(true);
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPlus aria-hidden className="h-4 w-4" />
        เพิ่มสมาชิก
      </button>

      <Modal
        open={open}
        onClose={() => {
          setTemporaryPassword(null);
          setShowSuccess(false);
          setOpen(false);
        }}
        title="เพิ่มสมาชิกใหม่"
      >
        {showSuccess && temporaryPassword ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">สร้างสมาชิกสำเร็จ ส่งรหัสผ่านชั่วคราวนี้ให้สมาชิกผ่านช่องทางที่ปลอดภัย</p>
            <code className="rounded-lg border border-border bg-muted-surface px-3 py-2 text-sm font-medium break-all">{temporaryPassword}</code>
            <button
              type="button"
              onClick={() => {
                setTemporaryPassword(null);
                setShowSuccess(false);
                setOpen(false);
              }}
              className="self-end rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              ปิด
            </button>
          </div>
        ) : (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            ชื่อสมาชิก
            <input name="displayName" required autoFocus className={fieldClass} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            อีเมล
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            สิทธิ์การใช้งาน
            <select
              name="role"
              required
              defaultValue="viewer"
              className={fieldClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            รหัสผ่านชั่วคราว
            <input
              name="tempPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              className={fieldClass}
            />
            <span className="text-xs font-normal text-muted">
              อย่างน้อย 12 ตัวอักษร สมาชิกต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก
            </span>
          </label>

          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTemporaryPassword(null);
                setShowSuccess(false);
                setOpen(false);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-50"
            >
              {pending ? "กำลังบันทึก..." : "บันทึกสมาชิก"}
            </button>
          </div>
        </form>
        )}
      </Modal>
    </>
  );
}
