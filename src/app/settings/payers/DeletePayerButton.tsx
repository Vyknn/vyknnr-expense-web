"use client";

import { useActionState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { confirmDelete } from "@/lib/confirm";
import { deletePayer, type PayerActionState } from "./actions";

const initialState: PayerActionState = { status: "idle" };

export function DeletePayerButton({
  payerId,
  payerName,
}: {
  payerId: number;
  payerName: string;
}) {
  const [state, formAction, pending] = useActionState(deletePayer, initialState);

  return (
    <form
      action={formAction}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const confirmed = await confirmDelete({
          title: `ลบผู้จ่าย/ผู้สำรอง "${payerName}" ใช่หรือไม่?`,
          text: "รายการค่าใช้จ่ายเดิมจะยังอยู่ แต่จะแสดงเป็นไม่ระบุผู้จ่าย",
        });
        if (confirmed) formAction(new FormData(form));
      }}
    >
      <input type="hidden" name="payerId" value={payerId} />
      {state.status === "error" && (
        <p role="alert" className="sr-only">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={`ลบผู้จ่าย ${payerName}`}
        className="inline-flex items-center gap-1 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive-tint focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
      >
        <IconTrash aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
