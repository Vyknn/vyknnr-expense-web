"use client";

import { useActionState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { deleteExpenseItem, type DeleteExpenseItemState } from "./actions";

const initialState: DeleteExpenseItemState = { status: "idle" };

export function DeleteItemButton({
  roundId,
  itemId,
}: {
  roundId: number;
  itemId: number;
}) {
  const [state, formAction, pending] = useActionState(
    deleteExpenseItem,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("ลบรายการนี้?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="ลบรายการนี้"
        className="inline-flex items-center gap-1 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive-tint focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
      >
        <IconTrash aria-hidden className="h-4 w-4" />
      </button>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
