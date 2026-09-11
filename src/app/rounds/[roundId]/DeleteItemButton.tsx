"use client";

import { useActionState } from "react";
import { TrashIcon } from "@/components/icons/icons";
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
        className="inline-flex items-center gap-1 rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
