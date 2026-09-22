"use client";

import { useActionState, useEffect, useState } from "react";
import { IconPencil } from "@tabler/icons-react";
import { Modal } from "@/components/modal/Modal";
import { Select } from "@/components/select/Select";
import { ROLES, ROLE_LABELS } from "@/types/role";
import { updateMemberRole, type MemberActionState } from "./actions";
import type { MemberSummary } from "./queries";

const initialState: MemberActionState = { status: "idle" };

export function EditMemberRoleModal({ member }: { member: MemberSummary }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMemberRole,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      // useActionState exposes the action outcome through state only.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`แก้ไขสิทธิ์ของ ${member.displayName}`}
        className="inline-flex items-center gap-1 rounded-lg p-2 text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPencil aria-hidden className="h-4 w-4" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`แก้ไขสิทธิ์ของ ${member.displayName}`}
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="memberId" value={member.id} />
          <label className="flex flex-col gap-1 text-sm">
            สิทธิ์การใช้งาน
            <Select name="role" required defaultValue={member.role}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </label>

          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-50"
            >
              {pending ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
