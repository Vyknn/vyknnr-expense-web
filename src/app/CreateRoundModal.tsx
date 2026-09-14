"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { IconPlus } from "@tabler/icons-react";
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
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPlus aria-hidden className="h-4 w-4" />
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
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            หมายเหตุ (ถ้ามี)
            <textarea
              name="note"
              rows={2}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </label>

          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
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
              {pending ? "กำลังสร้าง..." : "สร้างรอบ"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
