"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { PlusIcon } from "@/components/icons/icons";
import { createRound, type CreateRoundState } from "./actions";

const initialState: CreateRoundState = { status: "idle" };

export function CreateRoundModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createRound,
    initialState
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <PlusIcon className="h-4 w-4" />
        สร้างรอบใหม่
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="สร้างรอบใหม่">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            ชื่อรอบ
            <input
              name="name"
              required
              placeholder="เช่น รอบเดือนกันยายน 2569"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            หมายเหตุ (ถ้ามี)
            <textarea
              name="note"
              rows={2}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "กำลังสร้าง..." : "สร้างรอบ"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
