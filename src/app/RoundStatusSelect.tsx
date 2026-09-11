"use client";

import { useActionState } from "react";
import {
  ROUND_STATUSES,
  ROUND_STATUS_BADGE_CLASSES,
  ROUND_STATUS_LABELS,
  type RoundStatus,
} from "@/lib/round-status";
import { updateRoundStatus, type UpdateRoundStatusState } from "./actions";

const initialState: UpdateRoundStatusState = { status: "idle" };

export function RoundStatusSelect({
  roundId,
  status,
}: {
  roundId: number;
  status: RoundStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateRoundStatus,
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="roundId" value={roundId} />
      <select
        name="roundStatus"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="สถานะรอบ"
        className={`rounded border-0 px-2 py-0.5 text-xs font-medium outline-none disabled:opacity-50 ${ROUND_STATUS_BADGE_CLASSES[status]}`}
      >
        {ROUND_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ROUND_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
