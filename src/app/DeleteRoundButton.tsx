"use client";

import { useActionState } from "react";
import { TrashIcon } from "@/components/icons/icons";
import { deleteRound, type DeleteRoundState } from "./actions";

const initialState: DeleteRoundState = { status: "idle" };

export function DeleteRoundButton({
  roundId,
  roundName,
  redirectHome = false,
}: {
  roundId: number;
  roundName: string;
  redirectHome?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    deleteRound,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `ลบรอบ "${roundName}" ใช่หรือไม่? รายการค่าใช้จ่ายและใบเสร็จทั้งหมดในรอบนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="roundId" value={roundId} />
      {redirectHome && <input type="hidden" name="redirectTo" value="/" />}
      <button
        type="submit"
        disabled={pending}
        aria-label={`ลบรอบ ${roundName}`}
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
