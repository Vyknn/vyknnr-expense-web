"use client";

import { useActionState, useEffect, useState } from "react";
import { IconPencil } from "@tabler/icons-react";
import { Modal } from "@/components/modal/Modal";
import {
  updateRoundDetails,
  type UpdateRoundDetailsState,
} from "./actions";
import {
  ROUND_STATUSES,
  ROUND_STATUS_LABELS,
  type RoundStatus,
} from "@/lib/round-status";

const initialState: UpdateRoundDetailsState = { status: "idle" };
const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function EditRoundModal({
  roundId,
  name,
  note,
  status,
}: {
  roundId: number;
  name: string;
  note: string | null;
  status: RoundStatus;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateRoundDetails,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      // useActionState exposes action completion through state only.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPencil aria-hidden className="h-4 w-4" />
        แก้ไข
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="แก้ไขรายละเอียดรอบ">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="roundId" value={roundId} />

          <label className="flex flex-col gap-1 text-sm">
            ชื่อรอบ
            <input
              name="name"
              required
              autoFocus
              defaultValue={name}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            หมายเหตุ (ถ้ามี)
            <textarea
              name="note"
              rows={3}
              defaultValue={note ?? ""}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            สถานะ
            <select name="status" defaultValue={status} className={fieldClass}>
              {ROUND_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {ROUND_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
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
              {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
