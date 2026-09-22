"use client";

import { useActionState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { confirmDelete } from "@/lib/confirm";
import { deleteMember, type MemberActionState } from "./actions";

const initialState: MemberActionState = { status: "idle" };

export function DeleteMemberButton({
  memberId,
  memberName,
}: {
  memberId: number;
  memberName: string;
}) {
  const [state, formAction, pending] = useActionState(deleteMember, initialState);

  return (
    <form
      action={formAction}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const confirmed = await confirmDelete({
          title: `ลบสมาชิก "${memberName}" ใช่หรือไม่?`,
          text: "การลบไม่สามารถย้อนกลับได้",
        });
        if (confirmed) formAction(new FormData(form));
      }}
    >
      <input type="hidden" name="memberId" value={memberId} />
      {state.status === "error" && (
        <p role="alert" className="sr-only">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={`ลบสมาชิก ${memberName}`}
        className="inline-flex items-center gap-1 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive-tint focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
      >
        <IconTrash aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
