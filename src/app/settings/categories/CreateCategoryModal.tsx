"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Modal } from "@/components/modal/Modal";
import {
  createExpenseCategory,
  type ExpenseCategoryActionState,
} from "./actions";

const initialState: ExpenseCategoryActionState = { status: "idle" };
const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function CreateCategoryModal() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createExpenseCategory,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
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
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPlus aria-hidden className="h-4 w-4" />
        เพิ่มประเภท
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มประเภทค่าใช้จ่าย"
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            ชื่อประเภทค่าใช้จ่าย
            <input name="name" required autoFocus className={fieldClass} />
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
              {pending ? "กำลังบันทึก..." : "บันทึกประเภท"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
